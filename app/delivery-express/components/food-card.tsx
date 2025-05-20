"use client"

import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export interface FoodCardProps {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  size?: string
  slug: string
}

export function FoodCard({ id, name, description, price, originalPrice, discount, image, size, slug }: FoodCardProps) {
  return (
    <Link href={`/delivery-express/${slug}`} className="food-card-link">
      <div className="food-card">
        <div className="food-card-image-container">
          <img src={image || "/placeholder.svg"} alt={name} className="food-card-image" />
          {discount && discount > 0 && (
            <div className="food-card-badge">
              <Badge className="bg-blue-600 text-white font-medium">% Promoção</Badge>
            </div>
          )}
        </div>

        <div className="food-card-content">
          <h3 className="food-card-title">{name}</h3>
          <p className="food-card-description">{description}</p>

          <div className="food-card-footer">
            <div className="food-card-price-container">
              <div className="food-card-price">R$ {price.toFixed(2).replace(".", ",")}</div>

              {originalPrice && originalPrice > price && (
                <div className="food-card-original-price">
                  <span className="food-card-old-price">R$ {originalPrice.toFixed(2).replace(".", ",")}</span>
                  {discount && <span className="food-card-discount">{discount}% OFF</span>}
                </div>
              )}
            </div>

            {size && (
              <Badge variant="outline" className="food-card-size">
                {size}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .food-card-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        
        .food-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s ease;
          background-color: white;
        }
        
        .food-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .food-card-image-container {
          position: relative;
          width: 100%;
        }
        
        .food-card-image {
          width: 100%;
          aspect-ratio: 1/1;
          object-fit: cover;
        }
        
        .food-card-badge {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
        }
        
        .food-card-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 0.75rem;
        }
        
        .food-card-title {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .food-card-description {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.5rem;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .food-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
        }
        
        .food-card-price-container {
          display: flex;
          flex-direction: column;
        }
        
        .food-card-price {
          color: #f97316;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .food-card-original-price {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .food-card-old-price {
          font-size: 0.75rem;
          color: #888;
          text-decoration: line-through;
        }
        
        .food-card-discount {
          font-size: 0.7rem;
          background-color: #ffedd5;
          color: #c2410c;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
        }
        
        .food-card-size {
          font-size: 0.7rem;
          border: 1px solid #ddd;
          color: #666;
        }
        
        /* Estilos responsivos */
        @media (min-width: 640px) {
          .food-card {
            flex-direction: row;
          }
          
          .food-card-image-container {
            width: 33%;
          }
          
          .food-card-image {
            height: 100%;
          }
          
          .food-card-content {
            width: 67%;
            padding: 1rem;
          }
          
          .food-card-title {
            font-size: 1rem;
          }
          
          .food-card-description {
            font-size: 0.875rem;
          }
          
          .food-card-price {
            font-size: 1rem;
          }
        }
      `}</style>
    </Link>
  )
}
