(() => {
  const MODES = {
    name: { placeholder: "이름을 입력하세요 (예: 홍길동)" },
    subject: { placeholder: "과목을 입력하거나 목록에서 고르세요 (예: 수학)" },
    address: { placeholder: "주소의 일부를 입력하세요 (예: 수성구)" },
    phone: { placeholder: "전화번호를 입력하세요 (숫자만, 예: 5012)" },
    org: { placeholder: "학교 또는 동우회 이름을 입력하세요 (예: 협성동우회)" },
  };

  const $ = (sel) => document.querySelector(sel);
  const els = {
    loader: $("#loader"),
    file: $("#file"),
    sampleBtn: $("#sampleBtn"),
    status: $("#status"),
    searchArea: $("#searchArea"),
    tabs: [...document.querySelectorAll(".tab")],
    query: $("#query"),
    subjectList: $("#subjectList"),
    orgList: $("#orgList"),
    count: $("#count"),
    results: $("#results"),
  };

  let people = [];
  let mode = "name";

  function setStatus(text) {
    els.status.textContent = text;
  }

  function normalize(text) {
    return String(text || "").toLowerCase().replace(/\s+/g, "");
  }

  function digitsOnly(text) {
    return String(text || "").replace(/\D/g, "");
  }

  function matches(person, m, q) {
    if (!q) return false;
    switch (m) {
      case "name":
        return normalize(person.name).includes(normalize(q));
      case "subject":
        return normalize(person.subject).includes(normalize(q));
      case "address":
        return normalize(person.address).includes(normalize(q));
      case "org":
        return normalize(person.org).includes(normalize(q));
      case "phone": {
        const d = digitsOnly(q);
        if (!d) return false;
        return digitsOnly(person.phone).includes(d) || digitsOnly(person.mobile).includes(d);
      }
      default:
        return false;
    }
  }

  function fillSubjectList() {
    const subjects = [...new Set(people.map((p) => p.subject).filter(Boolean))].sort();
    els.subjectList.replaceChildren(
      ...subjects.map((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        return opt;
      })
    );
  }

  function fillOrgList() {
    const orgs = [...new Set(people.map((p) => p.org).filter(Boolean))].sort();
    els.orgList.replaceChildren(
      ...orgs.map((o) => {
        const opt = document.createElement("option");
        opt.value = o;
        return opt;
      })
    );
  }

  function makeCard(person) {
    const card = document.createElement("article");
    card.className = "card";

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = person.name || "(이름 없음)";

    const role = document.createElement("div");
    role.className = "card-role";
    role.textContent = [person.org, person.role, person.subject].filter(Boolean).join(" · ");

    card.append(name, role);

    const phoneText = person.mobile || person.phone;
    if (phoneText) {
      const tel = document.createElement("a");
      tel.className = "card-phone";
      tel.href = "tel:" + digitsOnly(phoneText);
      tel.textContent = "☎ " + phoneText;
      card.append(tel);
    }

    if (person.phone && person.mobile) {
      const sub = document.createElement("div");
      sub.className = "card-role";
      sub.textContent = "전화 " + person.phone;
      card.append(sub);
    }

    if (person.address) {
      const addr = document.createElement("div");
      addr.className = "card-addr";
      addr.textContent = person.address + (person.zip ? " (" + person.zip + ")" : "");
      card.append(addr);
    }

    return card;
  }

  function render() {
    const q = els.query.value.trim();
    els.results.replaceChildren();

    if (!q) {
      els.count.textContent = people.length + "명이 등록되어 있습니다.";
      return;
    }

    const found = people.filter((p) => matches(p, mode, q));
    els.count.textContent = "검색 결과 " + found.length + "명";

    if (found.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "일치하는 사람이 없습니다.";
      els.results.append(empty);
      return;
    }

    els.results.append(...found.slice(0, 200).map(makeCard));
    if (found.length > 200) {
      const more = document.createElement("p");
      more.className = "empty";
      more.textContent = "결과가 많아 200명까지만 표시합니다. 검색어를 더 입력해 주세요.";
      els.results.append(more);
    }
  }

  function setMode(next) {
    mode = next;
    els.tabs.forEach((tab) => {
      const active = tab.dataset.mode === next;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    els.query.placeholder = MODES[next].placeholder;
    const listId = { subject: "subjectList", org: "orgList" }[next];
    if (listId) els.query.setAttribute("list", listId);
    else els.query.removeAttribute("list");
    els.query.inputMode = next === "phone" ? "numeric" : "text";
    render();
  }

  function loadData(data) {
    if (!Array.isArray(data)) {
      throw new Error("배열(JSON 목록) 형식이 아닙니다.");
    }
    people = data.filter((p) => p && typeof p === "object");
    fillSubjectList();
    fillOrgList();
    els.loader.hidden = true;
    els.searchArea.hidden = false;
    setMode(mode);
    els.query.focus();
  }

  els.file.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      loadData(JSON.parse(text));
      setStatus("");
    } catch (err) {
      setStatus("파일을 읽지 못했습니다: " + err.message);
    }
  });

  els.sampleBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("sample.json");
      loadData(await res.json());
    } catch (err) {
      setStatus("샘플을 불러오지 못했습니다: " + err.message);
    }
  });

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setMode(tab.dataset.mode);
      els.query.value = "";
      render();
    });
  });

  els.query.addEventListener("input", render);
})();
