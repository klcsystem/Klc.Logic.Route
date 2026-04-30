export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-14 w-14' }
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-b-2 border-orange-400 ${sizeMap[size]}`} />
    </div>
  )
}
