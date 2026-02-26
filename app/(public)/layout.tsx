import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { CartProvider } from "@/components/shop/cart-provider";
import { getLayoutData } from "@/lib/cms/queries";
import { isEnabled } from "@/config/features";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { siteSettings, navLinks, footerSections } = await getLayoutData();
  const shopEnabled = isEnabled("shop");

  const content = (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        Skip to content
      </a>
      <Navbar links={navLinks} settings={siteSettings} />
      <main id="main-content" className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Footer sections={footerSections} settings={siteSettings} />
      {isEnabled("whatsapp") && siteSettings.whatsapp_number && (
        <WhatsAppButton phoneNumber={siteSettings.whatsapp_number} />
      )}
    </>
  );

  return shopEnabled ? <CartProvider>{content}</CartProvider> : content;
}
