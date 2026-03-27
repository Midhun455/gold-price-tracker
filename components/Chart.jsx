import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";

export default function Chart({ history }) {
    return (
        <LineChart width={300} height={200} data={history}>
            <XAxis dataKey="time" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="gold" />
            <Line type="monotone" dataKey="silver" />
        </LineChart>
    );
}