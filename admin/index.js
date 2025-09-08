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
      classNameWrapper,
      classNameWidget,
    } = props;

    const handleChange = (e) => onChange && onChange(e.target.value);

    // 새 항목 여부 판정
    const entry = props.entry;
    const isNewFromProp = props.isNewEntry === true;
    const isNewFromEntry =
      entry && entry.get && (entry.get("newRecord") || entry.get("isNew"));
    const isNew = Boolean(isNewFromProp || isNewFromEntry);

    return h(
      "div",
      { id: forID, className: classNameWrapper },
      h("input", {
        type: "text",
        value,
        onChange: handleChange,
        disabled: !isNew,
        placeholder: "영어 소문자와 숫자만",
        pattern: "^[a-z0-9]+$",
        className: classNameWidget, // CMS 기본 입력창 스타일 적용
      }),
      !isNew &&
        h(
          "small",
          { style: { display: "block", marginTop: "4px", opacity: 0.8 } },
          "이미 저장된 문서예요. 슬러그는 수정할 수 없어요."
        )
    );
  };

  CMS.registerWidget("lockedSlug", LockedSlugControl);
})();
