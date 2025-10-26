import Image from "next/image";
import onyxIcon from "../../public/Onyx-Icon.png";

type OnyxIconProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function OnyxIcon({
  size = 48,
  className,
  priority = false,
}: OnyxIconProps) {
  const width = size;
  const height = Math.round((size * onyxIcon.height) / onyxIcon.width);

  return (
    <Image
      src={onyxIcon}
      alt="Onyx logo"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
