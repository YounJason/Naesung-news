(function () {
  const { CMS, h } = window;
  if (!CMS || !h) {
    console.error("[lockedSlug] CMS 또는 h(React.createElement)를 찾을 수 없어요.");
    return;
  }

  const LockedSlugControl = (props) => {
    const value = props.value || "";
    const onChange = (e) => props.onChange && props.onChange(e.target.value);

    // 새 항목 여부(버전 호환 고려)
    const entry = props.entry;
    const isNewFromProp = props.isNewEntry === true;
    const isNewFromEntry =
      entry && entry.get && (entry.get("newRecord") || entry.get("isNew"));
    const isNew = Boolean(isNewFromProp || isNewFromEntry);

    return h(
      "div",
      {},
      h("input", {
        type: "text",
        value,
        onChange,
        disabled: !isNew,                // 기존 글이면 잠금!
        placeholder: "영어 소문자와 숫자만",
        pattern: "^[a-z0-9]+$",
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
