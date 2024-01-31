import { ProgressBar } from "react-bootstrap";
import { formatBytes } from "../../utils";
import { BigNumber } from "bignumber.js"
export default function UsageBar({ totalSpace, spaceUsed }) {
    return (
        <div>
            <ProgressBar now={BigNumber(spaceUsed).multipliedBy(100).dividedBy(totalSpace).toString()} />
            {formatBytes(spaceUsed)} used of {formatBytes(totalSpace)}
        </div>
    )
}


UsageBar.defaultProps = {
    totalSpace: 0,
    spaceUsed: 0,
}