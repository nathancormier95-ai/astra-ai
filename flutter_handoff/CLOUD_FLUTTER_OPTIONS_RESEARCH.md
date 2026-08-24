# Phone-First Flutter Cloud Environment Research

Research date: 2026-08-24

## Verified options

| Service | Verified free-tier position | Flutter and Android relevance | Recommendation |
|---|---|---|---|
| GitHub Codespaces | GitHub Free personal accounts include 15 GB-month storage and 120 core-hours monthly. A two-core machine consumes two included core-hours per elapsed hour. | Browser IDE that can use a custom dev container to install Flutter and Android command-line tools. It can edit, test, commit, and produce an Android artifact, although setup and Android builds consume quota. | Best code-first remote IDE for OmniMind because its repository is already on GitHub. |
| Codemagic | Single-user free account includes 500 Mac mini M2 build minutes per month, one concurrent build, and 30-day artifact history. | Hosted CI/CD built for mobile workflows; use it to build a debug APK or signed Android bundle from the GitHub repository after source changes. | Best companion builder; it is not a full mobile code editor. |
| Firebase Studio | The public landing page says three no-cost preview workspaces; the later official documentation says existing workspaces remain usable but new workspace creation and signup are not supported. | Flutter workspaces offer Android emulator previews and hot reload in the browser. | Worth using only if the user already has access. It is not a dependable new-account recommendation because official availability statements conflict. |
| FlutterFlow | Free tier supports visual development, testing, up to two projects, and web publishing. Code and APK downloads require the paid Basic plan. | Good for visual experiments only, not a free way to take OmniMind’s existing codebase to an installable Android APK. | Not recommended for this migration.

## Recommended free phone-first workflow

Use GitHub Codespaces as the coding environment and Codemagic as the Android builder. Work from the existing `nathancormier95-ai/astra-ai` repository, create the Flutter client in a new `omnimind-flutter` directory, and preserve the Expo app as a fallback. Configure Codespaces with Flutter, JDK 17, Android SDK command-line tools, and the project dependencies. Push changes to GitHub, then trigger a Codemagic Android debug build. Download the generated APK to the Android phone and install it for testing.

## Important limitations

A phone browser is workable for small edits but is slower and more error-prone than a keyboard-and-screen setup. Cloud IDEs generally cannot use USB debugging to attach directly to the phone, so the realistic test loop is build an APK remotely, download it on the phone, install it, and inspect behavior. Android emulator previews in Firebase Studio are browser-based, not the same as testing on the physical phone. The free limits and availability may change; check each provider’s plan page before storing a payment method or starting a long build.

## Official sources

1. [Firebase Studio overview](https://firebase.google.com/docs/studio)
2. [Firebase Studio app previews](https://firebase.google.com/docs/studio/preview-apps)
3. [Firebase Studio landing page](https://firebase.studio/)
4. [GitHub Codespaces billing](https://docs.github.com/billing/managing-billing-for-github-codespaces/about-billing-for-github-codespaces)
5. [Codemagic pricing](https://codemagic.io/pricing/)
6. [FlutterFlow pricing](https://flutterflow.io/pricing)
