"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Header } from "./components/header"
import { AppBar } from "./components/app-bar"
import { Navbar } from "./components/navbar"
import { CategorySection } from "./components/category-section"
import "./styles/food-card.css"

// Tipos para os produtos
interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  category: string
  tag?: string
  size?: string
  slug: string
}

export default function DeliveryExpressPage() {
  // Refs para as seções
  const destaquesRef = useRef<HTMLDivElement>(null)
  const pizzasRef = useRef<HTMLDivElement>(null)
  const lanchesRef = useRef<HTMLDivElement>(null)
  const porcoesRef = useRef<HTMLDivElement>(null)

  // Estado para a categoria ativa
  const [activeCategory, setActiveCategory] = useState("destaques")
  const [searchQuery, setSearchQuery] = useState("")

  // Categorias de navegação
  const categories = [
    { id: "destaques", name: "Destaques", color: "orange" },
    { id: "pizzas", name: "Pizzas", color: "red" },
    { id: "lanches", name: "Lanches", color: "amber" },
    { id: "porcoes", name: "Porções", color: "purple" },
  ]

  // Função para scrollar até a seção com offset para o header fixo
  const scrollToSection = (sectionId: string) => {
    const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
      destaques: destaquesRef,
      pizzas: pizzasRef,
      lanches: lanchesRef,
      porcoes: porcoesRef,
    }

    const sectionRef = sectionRefs[sectionId]

    if (sectionRef?.current) {
      const headerOffset = 120 // Altura aproximada do header fixo
      const elementPosition = sectionRef.current.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })

      setActiveCategory(sectionId)
    }
  }

  // Observar qual seção está visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            setActiveCategory(id)
          }
        })
      },
      {
        threshold: 0.2,
        rootMargin: "-120px 0px 0px 0px", // Offset para compensar o header fixo
      },
    )

    const sections = [
      { ref: destaquesRef, id: "destaques" },
      { ref: pizzasRef, id: "pizzas" },
      { ref: lanchesRef, id: "lanches" },
      { ref: porcoesRef, id: "porcoes" },
    ]

    sections.forEach((section) => {
      if (section.ref.current) {
        observer.observe(section.ref.current)
      }
    })

    return () => {
      sections.forEach((section) => {
        if (section.ref.current) {
          observer.unobserve(section.ref.current)
        }
      })
    }
  }, [])

  // Produtos de exemplo
  const products: Product[] = [
    {
      id: "1",
      name: "Frango c/ Catupiry + Bebida",
      description:
        "Molho de tomate, mussarela, frango, catupiry, azeitona e orégano. Acompanha uma bebida da sua escolha.",
      price: 48.0,
      originalPrice: 54.9,
      discount: 13,
      image: "/pizza-de-frango.png",
      category: "destaques",
      tag: "Promoção",
      size: "Média",
      slug: "frango-catupiry-bebida",
    },
    {
      id: "2",
      name: "Queridinho",
      description: "Pão brioche, hambúrguer artesanal, alface, queijo cheddar, picles e molho especial.",
      price: 14.9,
      originalPrice: 24.9,
      discount: 40,
      image: "/artesanal-hamburger.png",
      category: "destaques",
      tag: "Promoção",
      slug: "queridinho",
    },
    {
      id: "3",
      name: "Batata com Queijos e Bacon",
      description:
        "Nossa famosa batata australiana, recheada com queijo cheddar, queijo parmesão, queijo gorgonzola e bacon.",
      price: 34.9,
      originalPrice: 39.9,
      discount: 13,
      image: "/batata-queijo-bacon.png",
      category: "destaques",
      tag: "Promoção",
      slug: "batata-queijos-bacon",
    },
    {
      id: "4",
      name: "Carne Seca c/ Cream Cheese",
      description: "Molho de tomate, mussarela, cebola, carne seca desfiada, cream cheese e orégano.",
      price: 50.0,
      image: "/pizza-de-carne-seca.png",
      category: "pizzas",
      size: "Média",
      slug: "carne-seca-cream-cheese",
    },
    {
      id: "5",
      name: "Fabuloso Onion",
      description: "Pão brioche, hambúrguer artesanal, montanha de cebola, anéis de cebola e molho cheddar.",
      price: 24.9,
      image: "/hamburguer-com-cebola.png",
      category: "lanches",
      slug: "fabuloso-onion",
    },
    {
      id: "6",
      name: "Tabua de Jorge",
      description: "Picanha em tiras cuberta com cebolas em rodelas, batata frita crocante e acompanha vinagrete.",
      price: 169.9,
      originalPrice: 189.9,
      discount: 11,
      image: "/tabua-de-carnes.png",
      category: "porcoes",
      tag: "Promoção",
      slug: "tabua-de-jorge",
    },
  ]

  // Filtrar produtos por categoria e pesquisa
  const getProductsByCategory = (category: string) => {
    return products.filter(
      (product) =>
        product.category === category &&
        (searchQuery === "" ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }

  // Handler para pesquisa
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div className="pb-16">
      {/* Header fixo com Navbar */}
      <Header onSearch={handleSearch}>
        <Navbar categories={categories} activeCategory={activeCategory} onCategoryChange={scrollToSection} />
      </Header>

      {/* Conteúdo principal com padding para o header */}
      <main className="container mx-auto pt-32 px-4">
        {/* Seção Destaques */}
        <div id="destaques" ref={destaquesRef}>
          <CategorySection id="destaques-section" title="Destaques" products={getProductsByCategory("destaques")} />
        </div>

        {/* Seção Pizzas */}
        <div id="pizzas" ref={pizzasRef}>
          <CategorySection id="pizzas-section" title="Pizzas" products={getProductsByCategory("pizzas")} />
        </div>

        {/* Seção Lanches */}
        <div id="lanches" ref={lanchesRef}>
          <CategorySection id="lanches-section" title="Lanches" products={getProductsByCategory("lanches")} />
        </div>

        {/* Seção Porções */}
        <div id="porcoes" ref={porcoesRef}>
          <CategorySection id="porcoes-section" title="Porções" products={getProductsByCategory("porcoes")} />
        </div>
      </main>

      {/* App bar fixo na parte inferior */}
      <AppBar />
    </div>
  )
}
