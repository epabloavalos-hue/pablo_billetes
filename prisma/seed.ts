import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  // Gastos
  { name: 'Vivienda', type: 'EXPENSE', color: '#f87171', icon: 'home', isDefault: true },
  { name: 'Alimentación', type: 'EXPENSE', color: '#fb923c', icon: 'utensils', isDefault: true },
  { name: 'Transporte', type: 'EXPENSE', color: '#fbbf24', icon: 'car', isDefault: true },
  { name: 'Servicios', type: 'EXPENSE', color: '#a78bfa', icon: 'zap', isDefault: true },
  { name: 'Salud', type: 'EXPENSE', color: '#34d399', icon: 'heart-pulse', isDefault: true },
  { name: 'Educación', type: 'EXPENSE', color: '#60a5fa', icon: 'graduation-cap', isDefault: true },
  { name: 'Entretenimiento', type: 'EXPENSE', color: '#f472b6', icon: 'tv', isDefault: true },
  { name: 'Compras', type: 'EXPENSE', color: '#e879f9', icon: 'shopping-bag', isDefault: true },
  { name: 'Suscripciones', type: 'EXPENSE', color: '#94a3b8', icon: 'repeat', isDefault: true },
  { name: 'Deudas', type: 'EXPENSE', color: '#ef4444', icon: 'credit-card', isDefault: true },
  { name: 'Impuestos', type: 'EXPENSE', color: '#6b7280', icon: 'file-text', isDefault: true },
  { name: 'Otros gastos', type: 'EXPENSE', color: '#9ca3af', icon: 'more-horizontal', isDefault: true },
  // Ingresos
  { name: 'Salario', type: 'INCOME', color: '#4ade80', icon: 'briefcase', isDefault: true },
  { name: 'Freelance', type: 'INCOME', color: '#22d3ee', icon: 'laptop', isDefault: true },
  { name: 'Ahorro', type: 'INCOME', color: '#86efac', icon: 'piggy-bank', isDefault: true },
  { name: 'Inversiones', type: 'INCOME', color: '#a3e635', icon: 'trending-up', isDefault: true },
  { name: 'Otros ingresos', type: 'INCOME', color: '#6ee7b7', icon: 'plus-circle', isDefault: true },
  // Transferencias
  { name: 'Transferencias', type: 'TRANSFER', color: '#7dd3fc', icon: 'arrow-left-right', isDefault: true },
]

async function main() {
  console.log('Seeding categories...')
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.name },
      update: {},
      create: cat,
    })
  }

  // Upsert using name as a proxy — recreate with findFirst
  await prisma.category.deleteMany({})
  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }
  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
