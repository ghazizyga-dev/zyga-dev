import ReactDOM from "react-dom/client";
import { ProfilePanel } from "../components/ProfilePanel";
import {
  extractLinkedInProfileSlug,
  buildLinkedInProfileUrl,
} from "../lib/linkedin";
import { defineContentScript } from "wxt/sandbox";
import { createShadowRootUi } from "wxt/client";

export default defineContentScript({
  matches: ["*://www.linkedin.com/in/*"],

  async main(ctx) {
    let currentSlug: string | null = null;

    const shadowRootUi = await createShadowRootUi(ctx, {
      name: "ai-boilerplate-panel",
      position: "inline",
      anchor: "body",
      append: "last",
      onMount(container) {
        const wrapper = document.createElement("div");
        container.append(wrapper);

        const root = ReactDOM.createRoot(wrapper);

        function renderPanel(slug: string) {
          const linkedinUrl = buildLinkedInProfileUrl(slug);
          root.render(<ProfilePanel linkedinUrl={linkedinUrl} />);
        }

        const initialSlug = extractLinkedInProfileSlug(window.location.pathname);
        if (initialSlug) {
          currentSlug = initialSlug;
          renderPanel(initialSlug);
        }

        // LinkedIn is an SPA — poll for navigation
        const navigationInterval = setInterval(() => {
          const newSlug = extractLinkedInProfileSlug(window.location.pathname);
          if (newSlug !== currentSlug) {
            currentSlug = newSlug;
            if (newSlug) {
              renderPanel(newSlug);
            } else {
              root.render(null);
            }
          }
        }, 1000);

        return { root, navigationInterval };
      },
      onRemove(elements) {
        const typedElements = elements as unknown as {
          root: ReactDOM.Root;
          navigationInterval: ReturnType<typeof setInterval>;
        };
        clearInterval(typedElements.navigationInterval);
        typedElements.root.unmount();
      },
    });

    shadowRootUi.mount();
  },
});
