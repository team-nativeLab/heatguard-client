import { useEffect, useState } from "react";
import { DefaultProfileAvatar } from "../icons/Icons";

/**
 * 프로필 사진. 없거나 불러오지 못하면 기본 이미지를 보여준다.
 * 조회 URL은 만료될 수 있으므로, 로드에 실패하면 onExpired로 재조회를 요청한다.
 */
export default function ProfileAvatar({
  photoUrl,
  name,
  className,
  onExpired,
}: {
  photoUrl: string | null;
  name?: string;
  className?: string;
  onExpired?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  // 새 URL을 받으면 다시 시도한다.
  useEffect(() => {
    setFailed(false);
  }, [photoUrl]);

  if (!photoUrl || failed) return <DefaultProfileAvatar className={className} />;

  return (
    <img
      src={photoUrl}
      alt={name ? `${name} 프로필 사진` : "프로필 사진"}
      className={`${className ?? ""} rounded-full object-cover`}
      onError={() => {
        setFailed(true);
        onExpired?.();
      }}
    />
  );
}
