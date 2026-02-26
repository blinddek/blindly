import { generatePageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/cms/queries";
import { localBusinessSchema } from "@/lib/seo/structured-data";
import { isEnabled } from "@/config/features";
import { ContactForm } from "./contact-form";
import { GoogleMap } from "@/components/shared/google-map";
import { WhatsAppLink } from "@/components/shared/whatsapp-link";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export async function generateMetadata() {
  return generatePageMetadata("contact");
}

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema(settings)),
        }}
      />

      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-2 text-muted-foreground">
          Get in touch — we&apos;d love to hear from you.
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div>
            <ContactForm />
          </div>

          {/* Business Details */}
          <div className="space-y-8">
            <div className="space-y-4">
              {settings.phone_number && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a
                      href={`tel:${settings.phone_number}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {settings.phone_number}
                    </a>
                  </div>
                </div>
              )}
              {settings.email && (
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}
              {settings.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {settings.address}
                    </p>
                  </div>
                </div>
              )}
              {settings.business_hours && (
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">
                      {settings.business_hours}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp */}
            {isEnabled("whatsapp") && settings.whatsapp_number && (
              <WhatsAppLink phoneNumber={settings.whatsapp_number} />
            )}

            {/* Google Maps */}
            {isEnabled("googleMaps") && settings.google_maps_url && (
              <GoogleMap
                embedUrl={settings.google_maps_url}
                title={`${settings.company_name || "Our"} location`}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
