// admin/index.js
import CMS from "decap-cms-app"; // (혹은 netlify-cms-app)

function LockedSlugControl(props) {
  const value = props.value || "";
  // Decap/Netlify CMS는 편집기에서 "새 항목인지"를 알려주는 플래그가 있습니다.
  // 보통 props.isNewEntry 가 전달됩니다. (버전에 따라 entry.get('isNew') 형태일 수 있음)
  const isNew = props.isNewEntry === true;

  const onChange = (e) => props.onChange?.(e.target.value);

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={!isNew}             // 기존 글이면 잠금!
        placeholder="영어 소문자와 숫자만"
        pattern="^[a-z0-9]+$"
      />
      {!isNew && <small>이미 저장된 문서예요. 슬러그는 수정할 수 없어요.</small>}
    </div>
  );
}

CMS.registerWidget("lockedSlug", LockedSlugControl);
