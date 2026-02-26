import { generatePageMetadata } from "@/lib/seo/metadata";
import { getFaqs } from "@/lib/cms/queries";
import { faqPageSchema } from "@/lib/seo/structured-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export async function generateMetadata() {
  return generatePageMetadata("faq");
}

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
      <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
      <p className="mt-2 text-muted-foreground">
        Find answers to common questions below.
      </p>

      {faqs.length > 0 ? (
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left">
                {faq.question.en}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer.en}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="mt-8 text-muted-foreground">
          No FAQs have been added yet. Check back soon!
        </p>
      )}

      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqPageSchema(faqs)),
          }}
        />
      )}
    </section>
  );
}
