(function () {
  const { CMS, h } = window;
  if (!CMS || !h) {
    console.error("[lockedSlug] CMS 또는 h(React.createElement)를 찾을 수 없어요.");
    return;
  }

  const LockedSlugControl = (props) => {
    const {
      value = "",
      onChange,
      forID,
      classNameWidget,
    } = props;

    // 새 항목 여부 판정
    const entry = props.entry;
    const isNewFromProp = props.isNewEntry === true;
    const isNewFromEntry =
      entry && entry.get && (entry.get("newRecord") || entry.get("isNew"));
    const isNew = Boolean(isNewFromProp || isNewFromEntry);

    const handleChange = (e) => {
      // 입력값에서 영어 소문자와 숫자만 남김
      const filtered = e.target.value.replace(/[^a-z0-9]/g, "");
      onChange && onChange(filtered);
    };

    return h("input", {
      id: forID,
      type: "text",
      value,
      onChange: handleChange,
      disabled: !isNew,
      placeholder: "영어 소문자와 숫자만 입력하세요",
      className: classNameWidget, // CMS 기본 스타일 유지
    });
  };

  CMS.registerWidget("lockedSlug", LockedSlugControl);
})();
