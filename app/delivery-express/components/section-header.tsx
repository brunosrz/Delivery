interface SectionHeaderProps {
  title: string
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="bg-gray-500 text-white py-3 px-4 rounded-md mb-4">
      <h2 className="text-2xl font-bold text-center">{title}</h2>
    </div>
  )
}
