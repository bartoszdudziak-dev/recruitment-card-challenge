import creditCardType from "credit-card-type";

export default function () {
  const defaultValues = {
    card: {
      holder: "AD SOYAD",
      number: "#".repeat(16),
      date: {
        month: "MM",
        year: "YY",
      },
      cvv: "",
      types: ["visa", "mastercard"],
    },
    timers: {
      imageFade: null,
      resize: null,
    },
    movingBox: {
      offset: 8,
    },
  };

  const cardForm = document.querySelector(".card__form");
  const numberInput = cardForm.querySelector("#card-number");
  const holderInput = cardForm.querySelector("#card-holder");
  const cvvInput = cardForm.querySelector("#card-cvv");
  const yearSelect = cardForm.querySelector("#card-year");
  const monthSelect = cardForm.querySelector("#card-month");

  const cardPreview = document.querySelector(".card__preview");
  const flipElement = cardPreview.querySelector(".card__preview__container");
  const numberPreview = cardPreview.querySelector("#card-number-preview");
  const holderPreview = cardPreview.querySelector("#card-holder-preview");
  const cvvPreview = cardPreview.querySelector("#card-cvv-preview");
  const datePreview = cardPreview.querySelector("#card-date-preview");
  const yearPreview = datePreview.querySelector("#card-year-preview");
  const monthPreview = datePreview.querySelector("#card-month-preview");
  const movingBox = cardPreview.querySelector("#moving-box");
  const creditCardsList = [
    ...cardPreview.querySelectorAll(".card__preview-thumbnail--card"),
  ];

  init();

  function init() {
    createElements();
    setDefaultValues();

    const movingBoxTriggers = [
      numberInput,
      holderInput,
      monthSelect,
      yearSelect,
    ];

    holderInput.addEventListener("input", handleHolderChange);
    numberInput.addEventListener("input", handleNumberChange);
    yearSelect.addEventListener("change", handleYearChange);
    monthSelect.addEventListener("change", handleMonthChange);
    cvvInput.addEventListener("input", handleCvvChange);
    cvvInput.addEventListener("focus", handleFlipCard);
    cvvInput.addEventListener("blur", handleFlipCard);
    cardForm.addEventListener("submit", handleSubmit);

    window.addEventListener("resize", handleResize);
    movingBoxTriggers.forEach((trigger) =>
      trigger.addEventListener("focus", moveBox)
    );
    movingBoxTriggers.forEach((trigger) =>
      trigger.addEventListener("blur", hideBox)
    );
  }

  function handleMonthChange() {
    monthPreview.classList.add("fade");

    setTimeout(() => {
      monthPreview.textContent = this.value;
      monthPreview.classList.remove("fade");
    }, 200);
  }

  function handleYearChange() {
    yearPreview.classList.add("fade");

    setTimeout(() => {
      yearPreview.textContent = this.value.slice(-2);
      yearPreview.classList.remove("fade");
    }, 200);
  }

  function handleCvvChange() {
    this.value = formatCardCvv(this.value);
    cvvPreview.textContent = this.value;
  }

  function handleHolderChange(e) {
    this.value = formatCardHolder(this.value);

    const hasInsertedText = e.inputType.startsWith("insert");
    const output = hasInsertedText ? animateText(this.value) : this.value;

    holderPreview.innerHTML = output || defaultValues.card.holder;
  }

  function handleFlipCard() {
    flipElement.classList.toggle("flip");
  }

  function handleNumberChange(e) {
    const { target: input } = e;

    input.value = formatCardNumber(input.value);
    const value = cleanString(input.value);

    updateCreditCardImage(value);
    rollText(value);
  }

  function updateCreditCardImage(number) {
    clearTimeout(defaultValues.timers.imageFade);

    const cardTypes = defaultValues.card.types;
    const type = creditCardType(number)[0]?.type;
    const imagePath = getImagePath(type);

    if (cardTypes.includes(type))
      creditCardsList.forEach((image, i) => {
        if (imagePath !== image.src) {
          if (i === 0) image.classList.add("fade");

          defaultValues.timers.imageFade = setTimeout(() => {
            image.setAttribute("src", imagePath);
            image.setAttribute("alt", type);
            image.setAttribute("title", type);

            if (i === 0) image.classList.remove("fade");
          }, 150);
        }
      });
  }

  function moveBox(e, targetElement) {
    const extraOffset = defaultValues.movingBox.offset;

    const config = [
      { trigger: numberInput, target: numberPreview },
      { trigger: holderInput, target: holderPreview.parentElement },
      { trigger: yearSelect, target: datePreview.parentElement },
      { trigger: monthSelect, target: datePreview.parentElement },
    ];

    const target = config.find(
      (option) => option.trigger === (targetElement || this)
    )?.target;
    if (!target) return;

    movingBox.style.top = `${target.offsetTop - extraOffset}px`;
    movingBox.style.left = `${target.offsetLeft - extraOffset}px`;
    movingBox.style.height = `${target.offsetHeight + extraOffset * 2}px`;
    movingBox.style.width = `${target.offsetWidth + extraOffset * 2}px`;
    movingBox.style.opacity = "1";
  }

  function hideBox() {
    movingBox.style.opacity = "0";
  }

  function handleResize(e) {
    clearTimeout(defaultValues.timers.resize);
    movingBox.classList.add("transitionOff");
    moveBox(e, document.activeElement);

    defaultValues.timers.resize = setTimeout(() => {
      movingBox.classList.remove("transitionOff");
    }, 100);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const formElements = [...e.target.elements].filter(
      (input) => input.type !== "submit"
    );
    const formData = formElements.reduce(
      (acc, { name, value }) => ({ ...acc, [name]: value }),
      {}
    );

    // Mock validation
    const isValid = validateForm(formData);

    if (isValid) {
      resetForm(formElements);
      console.log(formData);
    }
  }

  function validateForm(formData) {
    return !Object.values(formData).some((value) => !value);
  }

  function resetForm(formElements) {
    formElements.forEach((input) => (input.value = ""));
    setDefaultValues();
    clearCardNumberPreview();
    document?.activeElement?.blur();
  }

  function clearCardNumberPreview() {
    numberPreview.innerHTML = "";
    createCardNumberPreview(numberPreview, defaultValues.card.number);
  }

  function setDefaultValues() {
    const {
      card: {
        holder,
        date: { month, year },
      },
      cvv,
    } = defaultValues;

    monthPreview.textContent = month;
    yearPreview.textContent = year;
    holderPreview.textContent = holder;
    cvvPreview.textContent = cvv;
  }

  function createElements() {
    const {
      card: { number },
    } = defaultValues;

    createCardNumberPreview(numberPreview, number);
    createMonthOptions(monthSelect);
    createYearOptions(yearSelect);
  }

  function createYearOptions(parentElement, optionsNumber = 12) {
    const year = new Date().getFullYear();

    for (let i = 0; i < optionsNumber; i++) {
      const option = document.createElement("option");

      option.setAttribute("value", year + i);
      option.textContent = year + i;

      parentElement.appendChild(option);
    }
  }

  function createMonthOptions(parentElement, optionsNumber = 12) {
    for (let i = 1; i <= optionsNumber; i++) {
      const option = document.createElement("option");
      const value = String(i).padStart(2, "0");

      option.setAttribute("value", value);
      option.textContent = value;

      parentElement.appendChild(option);
    }
  }

  function createCardNumberPreview(
    parentElement,
    placeholder,
    charsPerGroup = 4
  ) {
    const charGroups = Math.ceil(placeholder.length / charsPerGroup);

    for (let i = 0; i < charGroups; i++) {
      const groupElement = document.createElement("div");
      groupElement.classList.add("characters");

      for (let j = 0; j < charsPerGroup; j++) {
        const charElement = document.createElement("div");
        charElement.classList.add("character", "rollOut");

        const placeholderSpan = document.createElement("span");
        placeholderSpan.textContent = placeholder.charAt(i);

        const numberSpan = document.createElement("span");

        charElement.append(placeholderSpan, numberSpan);
        groupElement.appendChild(charElement);
      }

      parentElement.appendChild(groupElement);
    }
  }

  function rollText(text) {
    const characters = [...document.querySelectorAll(".character")];

    characters.forEach((char, i) => {
      if (text.charAt(i)) {
        char.classList.add("rollIn");
        char.classList.remove("rollOut");
        char.lastElementChild.textContent = text.charAt(i);
      } else {
        char.classList.remove("rollIn");
        char.classList.add("rollOut");
      }
    });
  }

  function animateText(text) {
    if (!text) return null;

    const lastChar = `<span class='twist'>${text.slice(-1)}</span>`;
    const animatedText = text.slice(0, -1) + lastChar;

    return animatedText;
  }

  function formatCardNumber(string, maxLength = 16) {
    return string
      .replace(/\D/g, "")
      .slice(0, maxLength)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatCardCvv(string, maxLength = 4) {
    return string.replace(/\D/g, "").slice(0, maxLength);
  }

  function formatCardHolder(string, maxLength = 20) {
    return string.replace(/[^a-zA-Z\s]/g, "").slice(0, maxLength);
  }

  function cleanString(string) {
    return string.replace(/\s+/g, "");
  }

  function getImagePath(endpoint) {
    const basePath = creditCardsList[0].src.split("/").slice(0, -1).join("/");
    return `${basePath}/${endpoint}.png`;
  }
}
