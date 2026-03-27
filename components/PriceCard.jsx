export default function PriceCard({ title, value }) {
    return (
        <div className="bg-zinc-900 p-4 rounded-xl mb-3">
            <h2>{title}</h2>
            <p className="text-yellow-400 text-2xl">
                ₹ {value.toFixed(2)}
            </p>
        </div>
    );
}