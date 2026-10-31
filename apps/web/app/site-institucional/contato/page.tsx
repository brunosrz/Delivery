import { ContactForm } from "./contact-form"

export const metadata = { title: "Contato | Delivery Express" }

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold">Fale com a gente</h1>
      <p className="mb-6 text-gray-700">
        Quer conhecer o Delivery Express ou tem uma dúvida? Deixe sua mensagem e respondemos por e-mail.
      </p>
      <ContactForm />
    </div>
  )
}
