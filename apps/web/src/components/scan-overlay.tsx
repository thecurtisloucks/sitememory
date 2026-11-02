import type { ObjectObservation, Scan } from "@sitememory/shared";

const colors = ["#6ee7c7", "#7dd3fc", "#c4b5fd", "#f9a8d4", "#fcd34d"];

export function ScanOverlay({
  scan,
  selectedId,
  onSelect,
}: {
  scan: Scan;
  selectedId?: string;
  onSelect: (observation: ObjectObservation) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
      <img
        src={scan.imageUrl}
        alt={`Observation ${scan.originalFilename}`}
        className="block h-auto w-full"
      />
      {scan.observations.map((observation, index) => {
        const box = observation.boundingBox;
        const color = colors[index % colors.length];
        const selected = observation.id === selectedId;
        return (
          <button
            key={observation.id}
            type="button"
            aria-label={`Select ${observation.label}`}
            onClick={() => onSelect(observation)}
            className="group absolute text-left focus:outline-none"
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            }}
          >
            {observation.mask ? (
              <svg
                className="absolute inset-0 h-full w-full overflow-visible"
                viewBox={`0 0 ${observation.mask.width} ${observation.mask.height}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d={observation.mask.path}
                  fill={color}
                  fillOpacity={selected ? 0.42 : 0.25}
                  stroke={color}
                  strokeWidth={selected ? 12 : 7}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : null}
            <span
              className="absolute inset-0 rounded-sm border-2"
              style={{
                borderColor: color,
                boxShadow: selected ? `0 0 0 3px ${color}55` : undefined,
              }}
            />
            <span
              className="absolute left-0 top-0 max-w-full -translate-y-full truncate rounded-t-md px-2 py-1 text-[11px] font-semibold text-ink"
              style={{ backgroundColor: color }}
            >
              {observation.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
