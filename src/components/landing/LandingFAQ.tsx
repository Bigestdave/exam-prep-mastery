import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function LandingFAQ() {
  return (
    <section className="py-14 md:py-20 border-t border-border">
      <div className="container px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-muted-foreground mb-2">Questions</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">We anticipated<br/>your doubts</h2>
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: 'How do I know this will actually help me pass?', a: 'Your exams are set from tutorial questions. We solve every single one to first-class standard, then give you a quiz to make sure you actually retained the material. Students who use LCU Prep consistently report walking into exams feeling confident, not anxious.' },
              { q: 'Is the quiz free?', a: 'Yes. Every course with quiz data has a free confidence check you can take before or after unlocking. It\'s our way of proving the material works.' },
              { q: 'Are these real answers or just AI guessing?', a: 'Every answer is written from your course materials and verified against their lecture notes. We don\'t generate generic content. What you read is what your exam expects.' },
              { q: 'Is payment for all courses or one course?', a: 'Payment is per course. You unlock only the courses you\'re actually taking this semester.' },
              { q: 'Can I see the answers before paying?', a: 'You can preview one solved question per course and take the free quiz before unlocking.' },
              { q: 'How long do I have access after paying?', a: 'Access lasts for the current semester. Study at your own pace.' },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
