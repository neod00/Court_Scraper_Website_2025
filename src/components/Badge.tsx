export default function Badge({ children, color = 'blue' }: { children: React.ReactNode, color?: 'blue' | 'red' | 'green' | 'gray' | 'purple' | 'yellow' }) {
    const colorClasses = {
        blue: 'bg-[#D7E7DF] text-[#1F3D7A]',
        red: 'bg-red-100 text-red-800',
        green: 'bg-[#D7E7DF] text-[#1F4D3F]',
        gray: 'bg-[#E9E4D8] text-[#161616]',
        purple: 'bg-[#D7E7DF] text-[#1F3D7A]',
        yellow: 'bg-[#F6F1C4] text-[#161616]',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none border border-[#161616] text-xs font-medium ${colorClasses[color]}`}>
            {children}
        </span>
    );
}
