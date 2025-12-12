export default function Badge({ children, color = 'blue' }: { children: React.ReactNode, color?: 'blue' | 'red' | 'green' | 'gray' }) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800',
        red: 'bg-red-100 text-red-800',
        green: 'bg-green-100 text-green-800',
        gray: 'bg-gray-100 text-gray-800',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
            {children}
        </span>
    );
}
