import UIKit
import WebKit

/// Full-screen web view that runs the coloring app offline from the app bundle.
final class StudioViewController: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {
    private var webView: WKWebView!
    private static let paper = UIColor(red: 0xFB / 255, green: 0xF7 / 255, blue: 0xF0 / 255, alpha: 1)

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: BundleSchemeHandler.scheme)
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.dataDetectorTypes = []
        // The page asks the app to save/share pictures through this channel.
        config.userContentController.add(WeakMessageProxy(self), name: "studio")
        #if DEBUG
        // Debug builds forward page errors and console.error/warn to the Xcode console.
        config.userContentController.add(WeakMessageProxy(self), name: "log")
        let forward = """
        (function(){var h=window.webkit.messageHandlers.log;
        window.addEventListener('error',function(e){h.postMessage('error: '+e.message+' @'+e.filename+':'+e.lineno);});
        window.addEventListener('unhandledrejection',function(e){h.postMessage('rejection: '+e.reason);});
        ['error','warn','log'].forEach(function(k){var o=console[k];console[k]=function(){
          try{h.postMessage(k+': '+Array.prototype.join.call(arguments,' '));}catch(x){} o.apply(console,arguments);};});})();
        """
        config.userContentController.addUserScript(WKUserScript(source: forward, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        #endif

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = Self.paper
        webView.scrollView.backgroundColor = Self.paper
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false
        webView.allowsLinkPreview = false
        webView.allowsBackForwardNavigationGestures = false
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
        #endif
        view = webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        webView.load(URLRequest(url: URL(string: "\(BundleSchemeHandler.scheme)://app/index.html")!))
    }

    override var prefersStatusBarHidden: Bool { true }
    override var prefersHomeIndicatorAutoHidden: Bool { true }
    // Edge swipes need a second swipe, so little hands drawing near the edge don't leave the app.
    override var preferredScreenEdgesDeferringSystemGestures: UIRectEdge { .all }

    // Keep everything inside the app; nothing is loaded from the internet.
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(action.request.url?.scheme == BundleSchemeHandler.scheme ? .allow : .cancel)
    }

    // If the web content process is killed in the background, reload instead of showing a blank page.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "log" { NSLog("[page] %@", String(describing: message.body)); return }
        guard let body = message.body as? [String: Any], body["type"] as? String == "share",
              let dataURL = body["image"] as? String,
              let comma = dataURL.firstIndex(of: ","),
              let data = Data(base64Encoded: String(dataURL[dataURL.index(after: comma)...])),
              let image = UIImage(data: data) else { return }
        share(image, from: body["rect"] as? [String: Double])
    }

    private func share(_ image: UIImage, from rect: [String: Double]?) {
        let sheet = UIActivityViewController(activityItems: [image], applicationActivities: nil)
        if let pop = sheet.popoverPresentationController {
            pop.sourceView = view
            if let r = rect, let x = r["x"], let y = r["y"], let w = r["w"], let h = r["h"] {
                pop.sourceRect = CGRect(x: x, y: y, width: w, height: h)
            } else {
                pop.sourceRect = CGRect(x: view.bounds.maxX - 60, y: 40, width: 1, height: 1)
            }
        }
        presentedViewController?.dismiss(animated: false)
        present(sheet, animated: true)
    }
}

/// WKUserContentController keeps a strong reference to its handlers; this breaks the cycle.
private final class WeakMessageProxy: NSObject, WKScriptMessageHandler {
    weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        target?.userContentController(c, didReceive: m)
    }
}
