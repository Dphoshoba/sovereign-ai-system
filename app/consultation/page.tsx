import ConsultationForm from "@/components/consultation/ConsultationForm"

export default function ConsultationPage() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <section style={{ maxWidth: "760px", margin: "0 auto" }}>
        <p style={{ fontWeight: "bold", textTransform: "uppercase" }}>
          Echoes & Visions
        </p>

        <h1>Book a Strategy Consultation</h1>

        <p style={{ fontSize: "18px", lineHeight: 1.6 }}>
          Tell us what you are building, where you feel stuck, and what kind of
          AI automation or content system would help you move forward.
        </p>

        <ConsultationForm />
      </section>
    </main>
  )
}