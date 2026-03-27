import { useState } from "react";

export default function Calculator({ price }) {
    const [g, setG] = useState(10);

    return (
        <div className="mt-4">
            <input
                value={g}
                onChange={(e) => setG(e.target.value)}
                className="text-black px-2"
            />
            <div>Total: ₹ {(g * price).toFixed(2)}</div>
        </div>
    );
}