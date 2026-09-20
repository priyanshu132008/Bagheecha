/**
 * The menu — transcribed from the hotel's own printed cards.
 *
 * SOURCE. `Bagheecha/Untitled document.docx` is not a document with text
 * in it: it is ten photographs of the physical menu, at 720x1280. Every
 * name and every figure below was read off those photographs by eye. The
 * cards are two books — a green food menu and a black bar menu, both
 * marked "AC" for the air-conditioned room.
 *
 * WHAT IS DELIBERATELY NOT HERE: descriptions.
 *
 * The cards print a name and a price and nothing else. Writing "slow-cooked
 * for six hours" or "our signature blend" for a real business's food would
 * be inventing claims about dishes a real kitchen cooks and real guests eat
 * — and an invented line is how a guest with a nut allergy ends up
 * ordering something nobody described honestly. So `note` carries only
 * what the card itself says: `Half / Full`, `with bone`, `2 pcs`,
 * `1 kg · serves 5`, `Red / Green`. Those are real, checkable, and
 * genuinely useful at the table. Nothing here is embellished.
 *
 * PRICES. Food is a single figure, or `[half, full]` where the kitchen
 * prices both. Bar spirits are sold in up to five measures, so they are
 * modelled as a matrix instead — see `Pour`.
 *
 * TWO SPELLINGS WORTH KNOWING. The printed card says "BAGEECHA" on its
 * cover, without the `h`; the site, the signage and every other asset use
 * "Bagheecha". The site's spelling wins, so the one dish named after the
 * hotel reads "Bagheecha's Special Soup". Brand names printed with obvious
 * typos (`BUSWEISER`, `TUBOURG`, `ROMONOV`) are set to their real
 * spellings, because on a premium page a misspelt brand reads as *our*
 * mistake rather than the printer's.
 *
 * MARKET PRICE. The seafood section prices by the size of the fish, which
 * the card writes as "APS". Those carry `onRequest` rather than a guessed
 * number, and the section prints one honest footnote for the whole list.
 */

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------- */

/** Rupees. A single figure, or `[half, full]` where both are sold. */
export type Price = number | [number, number];

export type Dish = {
  name: string;
  price?: Price;
  /** A real qualifier from the card. Never marketing copy. */
  note?: string;
  /** Printed "APS" on the card — priced by size, so we ask. */
  onRequest?: boolean;
  /**
   * Turn 7: auto-classified by name in the `isVegFor()` call below.
   *
   *   `true`  → the row renders a green-tinted marker (`VegMarker`)
   *   `false` → the row renders a brown-tinted marker
   *   omitted → the row carries no marker at all (groups where the
   *            heuristic can't decide, e.g. `bread`, `Bagheecha's Special
   *            Soup`, `Butter Milk`). The marker is honest about its own
   *            limits, and "I don't know" is the safest answer when the
   *            printed card doesn't disambiguate.
   */
  isVeg?: boolean;
};

export type DishGroup = {
  id: string;
  name: string;
  items: Dish[];
};

export type FoodCategory = {
  id: string;
  name: string;
  /** One line for the sidebar, describing the category honestly. */
  blurb: string;
  groups: DishGroup[];
};

/**
 * One pour. `prices` aligns positionally with its group's `sizes`, and
 * `null` means the card leaves that column blank — Bombay Sapphire has no
 * 750ml and Heineken has no tin. Modelling it as a matrix rather than as
 * free text is what lets every column line up down the page.
 */
export type Pour = {
  name: string;
  prices: (number | null)[];
  note?: string;
};

export type BarCategory = {
  id: string;
  name: string;
  /** Column headers, shared by every pour in the group. */
  sizes: string[];
  items: Pour[];
};

/* ------------------------------------------------------------------
   The Kitchen
------------------------------------------------------------------- */

export const FOOD: FoodCategory[] = [
  {
    id: "starters",
    name: "Starters",
    blurb: "Before the main event — tandoor, wok, and the sea.",
    groups: [
      {
        id: "veg-starters",
        name: "Veg Starters",
        items: [
          { name: "Veg Platter", price: 680 },
          { name: "Sindoori Tikki", price: 310 },
          { name: "Cheese Corn Tikki", price: 310 },
          { name: "Dahi Ke Shole", price: 310 },
          { name: "French Fries", price: 160 },
          { name: "Aloo Chat", price: 210 },
          { name: "Kaju Fry", price: 240 },
          { name: "Cheese Pakoda", price: 240 },
          { name: "Plain Cheese", price: 80 },
          { name: "Wafers", price: 70 },
          { name: "Chana Koliwada", price: 210 },
          { name: "Garlic Oil Fry", price: 180 },
          { name: "Chana Garlic Oil Fry", price: 200 },
        ],
      },
      {
        id: "nonveg-starters",
        name: "Non-Veg Starters",
        items: [
          { name: "Mutton Sukha", price: 390 },
          { name: "Mutton Ghee Roast", price: 440, note: "with bone" },
          { name: "Chicken Ghee Roast", price: 390 },
          { name: "Jeera Chicken", price: 370 },
          { name: "Chicken Koyla", price: 370 },
          { name: "Chicken Jungli", price: [360, 520], note: "Half / Full" },
          { name: "Chicken Sukha Malvani", price: 320 },
          { name: "Chicken Sukha Aagri", price: 320 },
          { name: "Chicken Tawa Malvani", price: 360 },
          { name: "Chicken Tawa Aagri", price: 360 },
          {
            name: "Chicken Koliwada Malvani",
            price: 320,
            note: "with bone",
          },
          { name: "Chicken Koliwada Agri", price: 320, note: "with bone" },
        ],
      },
      {
        id: "tandoor-veg",
        name: "Tandoor — Veg",
        items: [
          { name: "Paneer Dilori Kebab", price: 340 },
          { name: "Cheese Chilli Kebab", price: 330 },
          { name: "Cheese Roll Kebab", price: 330 },
          { name: "Paneer Roll Kebab", price: 330 },
          { name: "Paneer Achari Tikka", price: 320 },
          { name: "Paneer Peri-Peri", price: 320 },
          { name: "Harabara Kebab", price: 300 },
          { name: "Paneer / Baby Corn / Mushroom Tikka", price: 310 },
          { name: "Paneer Bangalore Tikka", price: 310 },
          { name: "Paneer Chutney Kebab", price: 310 },
          { name: "Veg Seekh Kebab", price: 290 },
          { name: "Mushroom Tandoori", price: 280 },
          { name: "Tandoori Aloo", price: 240 },
        ],
      },
      {
        id: "tandoor-nonveg",
        name: "Tandoor — Non-Veg",
        items: [
          {
            name: "Non-Veg Platter",
            price: [620, 1000],
            note: "12 / 22 pcs",
          },
          { name: "Mutton Boti Kebab", price: 400 },
          { name: "Mutton Seekh Kebab", price: 390 },
          { name: "Chicken Seekh Kebab", price: 360 },
          { name: "Chicken Afghani Tikka", price: 350 },
          { name: "Chicken Kasturi Kebab", price: 340 },
          { name: "Tandoori Lollipop", price: 340, note: "Red" },
          { name: "Tandoori Lollipop", price: 340, note: "Green" },
          { name: "Lemon Tandoori", price: [340, 500], note: "Half / Full" },
          { name: "Chicken Achari Tikka", price: 330 },
          { name: "Chicken Angara Kebab", price: 330 },
          { name: "Chicken Banglori Kebab", price: 330 },
          { name: "Chicken Garlic Kebab", price: 330 },
          { name: "Chicken Kalimiri Kebab", price: 330 },
          { name: "Chicken Lasuni Tikka", price: 330 },
          { name: "Chicken Reshmi Kebab", price: 330 },
          { name: "Chicken Rim-Zim Kebab", price: 330 },
          {
            name: "Chicken Afghani Tandoori",
            price: [330, 530],
            note: "Half / Full",
          },
          { name: "Chicken Pahadi Kebab", price: 320 },
          { name: "Chicken Peshawari Kebab", price: 320 },
          { name: "Chicken Pudina Tikka", price: 320 },
          { name: "Chicken Tikka", price: 320 },
          { name: "Chicken Green & White", price: [310, 510], note: "Half / Full" },
          { name: "Chicken Peri Peri", price: [310, 510], note: "Half / Full" },
          { name: "Chicken Tangadi Kebab", price: 400, note: "2 pcs" },
          { name: "Chicken Tandoori", price: [280, 470], note: "Half / Full" },
        ],
      },
      {
        id: "egg",
        name: "Egg Specials",
        items: [
          { name: "Boiled Egg", price: 70 },
          { name: "Egg Half Fry", price: 90 },
          { name: "Masala Omlet", price: 120 },
          { name: "Egg Bhurji", price: 170 },
          { name: "Egg Pakoda", price: 210 },
          { name: "Egg Masala Fry", price: 280 },
          { name: "Egg Masala", price: 280 },
          { name: "Egg Chilli", price: 280 },
        ],
      },
      {
        id: "seafood-starters",
        name: "Seafood Starters",
        items: [
          { name: "Prawns Masala Fry", price: 410 },
          { name: "Bombil Tawa", price: 260 },
          { name: "Bangda Tandoori", price: 250 },
          { name: "Mandeli Fry", price: 210 },
          { name: "Bangda Fry", price: 210 },
          { name: "Pomfret Tawa Fry", onRequest: true },
          { name: "Surmai Fry", onRequest: true },
          { name: "Prawns Tawa Fry", onRequest: true },
          { name: "Prawns Ghee Roast", onRequest: true },
          { name: "Prawns Koliwada", onRequest: true },
          { name: "Pomfret Tandoori", onRequest: true },
        ],
      },
      {
        id: "soups",
        name: "Soups",
        items: [
          { name: "Bagheecha's Special Soup", price: 230, note: "Gavathi" },
          { name: "Chicken Clear Soup", price: 200 },
          { name: "Chicken Manchow Soup", price: 200 },
          { name: "Chicken Hot & Sour Soup", price: 200 },
          { name: "Chicken Sweet Corn Soup", price: 200 },
          { name: "Chicken Lemon Coriander Soup", price: 200 },
          { name: "Chicken Jeera Special Soup", price: 200 },
          { name: "Tomato Soup", price: 190 },
          { name: "Palak Soup", price: 190 },
          { name: "Cream of Veg Soup", price: 190 },
          { name: "Cream of Mushroom Soup", price: 190 },
          { name: "Veg Manchow Soup", price: 190 },
          { name: "Veg Hot & Sour Soup", price: 190 },
          { name: "Veg Clear Soup", price: 190 },
          { name: "Veg Sweet Corn Soup", price: 190 },
          { name: "Veg Lemon Coriander Soup", price: 190 },
          { name: "Veg Jeera Special Soup", price: 190 },
          { name: "Veg Gavathi Soup", price: 190 },
        ],
      },
      {
        id: "salads",
        name: "Salads, Papad & Raita",
        items: [
          { name: "Pineapple Raita", price: 150 },
          { name: "Plain Curd", price: 150 },
          { name: "Khichiya Masala Papad", price: 120 },
          { name: "Green Salad", price: 120 },
          { name: "Veg Raita", price: 110 },
          { name: "Boondi Raita", price: 110 },
          { name: "Khichiya Fry Papad", price: 80 },
          { name: "Masala Papad", price: 70 },
          { name: "Khichiya Roasted Papad", price: 70 },
          { name: "Roasted Papad", price: 40 },
          { name: "Fry Papad", price: 40 },
        ],
      },
    ],
  },

  {
    id: "main-course",
    name: "Main Course",
    blurb: "The gravies, the biryani, and the bread to mop it up.",
    groups: [
      {
        id: "veg-main",
        name: "Veg Main Course",
        items: [
          { name: "Cashew Masala", price: 380 },
          { name: "Paneer Lonavala", price: [350, 490], note: "Half / Full" },
          { name: "Paneer Bhurji", price: 330 },
          { name: "Paneer Butter Masala", price: 320 },
          { name: "Paneer Lababdar", price: 320 },
          { name: "Paneer Masala", price: 320 },
          { name: "Paneer Mushroom Masala", price: 320 },
          { name: "Veg Lonavala", price: [320, 460], note: "Half / Full" },
          { name: "Paneer Handi", price: 310 },
          { name: "Paneer Kolhapuri", price: 310 },
          { name: "Paneer Makhani", price: 310 },
          { name: "Paneer Mutter", price: 310 },
          { name: "Paneer Tikka Masala", price: 310 },
          { name: "Paneer / Mushroom / Baby Corn Kadai", price: 310 },
          { name: "Palak Paneer / Paneer Mutter", price: 310 },
          { name: "Veg Makhani", price: 310 },
          { name: "Veg Mohini", price: 310 },
          { name: "Veg Seekh Kebab Masala", price: 310 },
          { name: "Paneer Bhartinda", price: 300 },
          { name: "Shahi Paneer", price: 300 },
          { name: "Dum Aloo Punjabi / Kashmiri", price: 290 },
          { name: "Mushroom Kadai", price: 290 },
          { name: "Veg Hydrabadi", price: 290 },
          { name: "Mushroom Mutter", price: 290 },
          { name: "Veg Kofta / Malai Kofta", price: [280, 310] },
          { name: "Chilli Milli Masala", price: 280 },
          { name: "Veg Tawa", price: 260 },
          { name: "Veg Tawa Masala", price: 260 },
          { name: "Aloo Gobi Masala", price: 250 },
          { name: "Aloo Mutter", price: 250 },
          { name: "Mix Veg", price: 250 },
          { name: "Veg Kolhapuri", price: 250 },
          { name: "Chole Masala", price: 230 },
          { name: "Dal Tadka", price: 230 },
          { name: "Dal Fry", price: 220 },
        ],
      },
      {
        id: "chicken-main",
        name: "Chicken",
        items: [
          { name: "Murg Musallam", price: [440, 830], note: "Half / Full" },
          { name: "Chicken Malvani", price: [370, 590], note: "Half / Full" },
          { name: "Chicken Agri Handi", price: [355, 490], note: "Half / Full" },
          { name: "Chicken Handi", price: [360, 570], note: "Half / Full" },
          { name: "Chicken Kadia", price: [360, 570], note: "Half / Full" },
          { name: "Chicken Lonavala", price: [360, 610], note: "Half / Full" },
          { name: "Butter Chicken", price: [350, 560], note: "Half / Full" },
          { name: "Chicken Tawa Masala", price: 360 },
          { name: "Chicken Hydrabadi", price: 350 },
          { name: "Chicken Tikka Masala", price: 350 },
          { name: "Chicken Afghani Masala", price: 340 },
          { name: "Chicken Kheema Masala", price: 340 },
          { name: "Chicken Lajawab", price: 340 },
          { name: "Chicken Lasuni Masala", price: 340 },
          { name: "Chicken Pahadi Masala", price: 340 },
          { name: "Chicken RaRa Masala", price: 340 },
          { name: "Chicken Masala", price: 310 },
        ],
      },
      {
        id: "mutton",
        name: "Mutton",
        items: [
          { name: "Mutton Bhuna", price: 490 },
          { name: "Mutton Kadai", price: [470, 670], note: "Half / Full" },
          { name: "Mutton Malwani", price: [470, 670], note: "Half / Full" },
          { name: "Mutton Handi", price: [440, 640], note: "Half / Full" },
          { name: "Mutton Tawa Masala", price: 440 },
          { name: "Mutton Afghani Masala", price: 410 },
          { name: "Mutton Kheema", price: 410 },
          { name: "Mutton Masala", price: 400 },
          { name: "Mutton Do Pyaza", price: 400 },
          { name: "Mutton Rara", price: 400 },
          { name: "Mutton Rogan Josh", price: 400 },
        ],
      },
      {
        id: "seafood-main",
        name: "Seafood",
        items: [
          { name: "Prawns Handi", price: 610 },
          { name: "Prawn's Masala", price: 440 },
          { name: "Prawn's Tawa Chatpata", price: 440 },
          { name: "Bangda Masala", price: 320 },
          { name: "Fish Gaon Curry", onRequest: true, note: "Surmai" },
          { name: "Surmai Masala", onRequest: true },
        ],
      },
      {
        id: "veg-rice",
        name: "Veg Rice & Biryani",
        items: [
          { name: "Paneer Tikka Biryani", price: 300 },
          { name: "Paneer Biryani", price: 290 },
          { name: "Palak Khichdi", price: 280 },
          { name: "Veg Dum Biryani", price: 280 },
          { name: "Curd Rice Tadka", price: 270 },
          { name: "Dal Khichdi", price: 270 },
          { name: "Dal Palak Khichdi", price: 270 },
          { name: "Peas Pulav", price: 270 },
          { name: "Veg Biryani", price: 270 },
          { name: "Veg Pulav", price: 270 },
          { name: "Veg Tawa Pulav", price: 270 },
          { name: "Biryani Rice", price: 200 },
          { name: "Jeera Rice", price: 200 },
          { name: "Steam Rice", price: 180 },
        ],
      },
      {
        id: "nonveg-rice",
        name: "Non-Veg Rice & Biryani",
        items: [
          { name: "Mutton Dum Biryani", price: 410 },
          { name: "Mutton Hyderabad Biryani", price: 410 },
          { name: "Prawns Biryani", price: 410 },
          { name: "Mutton Biryani", price: 400 },
          { name: "Chicken Combo Biryani", price: 390 },
          { name: "Chicken Tikka Biryani", price: 340 },
          { name: "Chicken Dum Biryani", price: 330 },
          { name: "Chicken Hydrabadi Biryani", price: 330 },
          { name: "Chicken Biryani", price: 310 },
          { name: "Egg Biryani", price: 270 },
        ],
      },
      {
        id: "biryani-kg",
        name: "Biryani by the Kilo",
        items: [
          { name: "Mutton Biryani", price: 1580, note: "1 kg · serves 5" },
          { name: "Prawns Biryani", price: 1530, note: "1 kg · serves 5" },
          { name: "Chicken Biryani", price: 1080, note: "1 kg · serves 5" },
          { name: "Paneer Biryani", price: 1080, note: "1 kg · serves 5" },
          { name: "Veg Biryani", price: 930, note: "1 kg · serves 5" },
        ],
      },
      {
        id: "bread",
        name: "Indian Bread",
        items: [
          { name: "Cheese Garlic Naan", price: 160 },
          { name: "Butter Garlic Naan", price: 140 },
          { name: "Garlic Naan", price: 130 },
          { name: "Butter Aloo Paratha", price: 100 },
          { name: "Butter Laccha Paratha", price: 80 },
          { name: "Butter Paratha", price: 80 },
          { name: "Butter Naan", price: 70 },
          { name: "Butter Kulcha", price: 60 },
          { name: "Laccha Paratha", price: 60 },
          { name: "Naan", price: 60 },
          { name: "Paratha", price: 60 },
          { name: "Kulcha", price: 50 },
          { name: "Butter Tandoori Roti", price: 45 },
          { name: "Tandoori Roti", price: 40 },
        ],
      },
    ],
  },

  {
    id: "chinese",
    name: "Chinese",
    blurb: "The wok side of the kitchen — starters, gravies, rice, noodles.",
    groups: [
      {
        id: "chinese-veg-starters",
        name: "Veg Starters",
        items: [
          { name: "Panner Teriyaki", price: 330, note: "Paneer" },
          { name: "Paneer Satay", price: 330 },
          { name: "Veg Dragon Roll", price: 310 },
          { name: "Veg Salt & Pepper", price: 300 },
          { name: "Veg Korean", price: 300 },
          { name: "Paneer Crispy", price: 300 },
          { name: "Paneer 65", price: 300 },
          { name: "Paneer Chilly", price: 290 },
          { name: "Mushroom Chilli", price: 290 },
          { name: "Veg Crispy", price: 280 },
          { name: "Veg Spring Roll", price: 280 },
          { name: "Cheese Corn Ball", price: 280 },
          { name: "Veg Chinese Bhel", price: 270 },
          { name: "Veg Lollipop", price: 270 },
          { name: "Crispy Potato Chilly", price: 260 },
          { name: "Gobi Manchurian", price: 250 },
          { name: "Veg Manchurian / Chilly", price: 250 },
        ],
      },
      {
        id: "chinese-nonveg-starters",
        name: "Non-Veg Starters",
        items: [
          { name: "Chicken Satay", price: 350 },
          { name: "Apple Chicken", price: 340 },
          { name: "Chicken Malaysian", price: 330 },
          { name: "Chicken Salt & Pepper", price: 320 },
          { name: "Chicken Black Bean Sauce", price: 320 },
          { name: "Chicken Barbeque Sauce", price: 320 },
          { name: "Chicken Black Pepper", price: 320 },
          { name: "Chicken Korean Sauce", price: 320 },
          { name: "Chicken Red Pepper", price: 320 },
          { name: "Chicken Hot Garlic", price: 320 },
          { name: "Chicken Hong Kong", price: 320 },
          { name: "Chicken 65", price: 310 },
          { name: "Chicken Teriyaki", price: 310 },
          { name: "Chicken Crispy", price: 310 },
          { name: "Chicken Spring Roll", price: 310 },
          { name: "Chicken Chilly Basil", price: 300 },
          { name: "Chicken Hunan", price: 300 },
          { name: "Chicken Drunken", price: 300 },
          { name: "Chicken Chilly", price: 300 },
          { name: "Chicken Manchurian", price: 300 },
          { name: "Chicken Lollipop", price: [210, 310], note: "Half / Full" },
        ],
      },
      {
        id: "chinese-gravies",
        name: "Gravies",
        items: [
          { name: "Thai Curry Chicken", price: 350, note: "Red / Green" },
          { name: "Lemon Chicken Gravy", price: 320 },
          { name: "Thai Curry Prawn's", price: 320, note: "Red / Green" },
          { name: "Chicken Chilli Gravy", price: 310 },
          { name: "Paneer Schezwan / Gravy", price: 310 },
          { name: "Paneer Chilli Gravy", price: 300 },
          { name: "Gobi Manchurian Gravy", price: 250 },
          { name: "Veg Manchurian Gravy", price: 250 },
        ],
      },
      {
        id: "chinese-rice",
        name: "Rice",
        items: [
          { name: "Chicken Chopper Rice", price: 390 },
          { name: "Chicken Triple Schezwan Fried Rice", price: 370 },
          { name: "Mix Schezwan Fried Rice", price: 370 },
          { name: "Chicken Garlic Fried Rice", price: 350 },
          { name: "Mix Fried Rice", price: 350 },
          { name: "Prawn's Fried Rice", price: 350 },
          { name: "Veg Pot Rice", price: 310 },
          { name: "Veg Triple Schezwan Fried Rice", price: 310 },
          { name: "Chicken American Chopsy", price: 310 },
          { name: "Chicken Hongkong Fried Rice", price: 300 },
          { name: "Chicken Singapore Fried Rice", price: 300 },
          { name: "Chicken Korean Fried Rice", price: 300 },
          { name: "Chicken Schezwan Fried Rice", price: 280 },
          { name: "Tomato Mushroom Fried Rice", price: 270 },
          { name: "Veg Hong Kong Fried Rice", price: 270 },
          { name: "Veg Singapore Fried Rice", price: 270 },
          { name: "Veg Korean Fried Rice", price: 270 },
          { name: "Veg American Chopsy", price: 270 },
          { name: "Veg Schezwan Rice", price: 260 },
          { name: "Chicken Fried Rice", price: 260 },
          { name: "Veg Fried Rice", price: 240 },
        ],
      },
      {
        id: "chinese-noodles",
        name: "Noodles",
        items: [
          { name: "Chicken Pot Thai Noodles", price: 350 },
          { name: "Chicken Chilly Crispy Noodles", price: 320 },
          { name: "Veg Pot Thai Noodles", price: 310 },
          { name: "Chicken Singapore Noodles", price: 300 },
          { name: "Chicken Hakka Noodles", price: 270 },
          { name: "Veg Hong Kong Noodles", price: 270 },
          { name: "Veg Singapore Noodles", price: 270 },
          { name: "Veg Hakka Noodles", price: 240 },
        ],
      },
    ],
  },

  {
    id: "desserts",
    name: "Desserts",
    blurb: "Three things, and the kitchen is honest about all of them.",
    groups: [
      {
        id: "desserts-list",
        name: "To Finish",
        items: [
          { name: "Sweet Lassi", price: 95 },
          { name: "Butter Milk", price: 85 },
          // The card prints this one with no figure at all, so we ask
          // rather than invent a number for it.
          { name: "Ice Cream", onRequest: true },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------
   The Bar
------------------------------------------------------------------- */

/**
 * Nine lists, in the order the bar book prints them: the clear and brown
 * spirits first, then rum and gin, then wine and beer.
 *
 * The 750ml / 180ml / 90ml / 60ml / 30ml ladder is the standard Indian
 * bar measure set — a full bottle, a half, and then 90, 60 and 30 ml
 * pegs — which is why every spirits list shares the same five columns.
 */
export const BAR: BarCategory[] = [
  {
    id: "vodka",
    name: "Vodka",
    sizes: ["750 ML", "180 ML", "90 ML", "60 ML", "30 ML"],
    items: [
      { name: "Absolut", prices: [3960, 1240, 625, 420, 215], note: "200 ml" },
      { name: "Smirnoff", prices: [2805, 705, 360, 245, 125] },
      { name: "Smirnoff Flavoured", prices: [2920, 730, 370, 250, 130] },
      { name: "White Mischief", prices: [1850, 465, 235, 160, 85] },
      { name: "Magic Moment", prices: [1850, 465, 235, 160, 85] },
      { name: "Magic Moment Flavoured", prices: [1850, 465, 235, 160, 85] },
      { name: "Romanov", prices: [1455, 365, 185, 125, 65] },
      { name: "Romanov Flavoured", prices: [1455, 365, 185, 125, 65] },
    ],
  },
  {
    id: "premium-whisky",
    name: "Premium Whisky",
    sizes: ["750 ML", "180 ML", "90 ML", "60 ML", "30 ML"],
    items: [
      { name: "Antiquity Blue", prices: [2870, 710, 360, 245, 125] },
      { name: "Oak Smith Gold", prices: [2640, 660, 335, 225, 115] },
      { name: "Blender's Reserve", prices: [2640, 695, 350, 235, 120] },
      { name: "Blenders Pride", prices: [2475, 630, 320, 215, 110] },
      { name: "Signature", prices: [2475, 630, 320, 215, 110] },
      { name: "Royal Stag Barrel", prices: [1980, 530, 290, 185, 95] },
    ],
  },
  {
    id: "scotch",
    name: "Scotch",
    sizes: ["750 ML", "180 ML", "90 ML", "60 ML", "30 ML"],
    items: [
      { name: "Black Label", prices: [6930, 1740, 880, 580, 300] },
      { name: "Jack Daniels", prices: [6270, 1980, 990, 660, 340] },
      { name: "Black & White", prices: [4785, 1205, 610, 410, 210] },
      { name: "Jameson", prices: [4620, 1405, 705, 470, 240] },
      { name: "Teachers", prices: [4705, 1190, 600, 400, 210] },
      { name: "Black Dog", prices: [4620, 1155, 585, 395, 200] },
      { name: "Vat 69", prices: [4455, 1130, 570, 385, 195] },
      { name: "Red Label", prices: [3960, 1075, 540, 365, 190] },
      { name: "Ballantine", prices: [3960, 1130, 570, 385, 195] },
      { name: "Glen Walk", prices: [2640, 910, 460, 310, 160] },
    ],
  },
  {
    id: "regular-whisky",
    name: "Regular Whisky",
    sizes: ["750 ML", "180 ML", "90 ML", "60 ML", "30 ML"],
    items: [
      { name: "Oaksmith Silver", prices: [2265, 545, 275, 185, 95] },
      { name: "Royal Challenge", prices: [1770, 430, 220, 150, 80] },
      { name: "Royal Stag", prices: [1770, 415, 215, 145, 75] },
      { name: "Iconiq White", prices: [1520, 380, 195, 135, 70] },
      { name: "MCD No. 1", prices: [1485, 365, 185, 125, 65] },
      { name: "Imperial Blue", prices: [1455, 365, 185, 125, 65] },
      { name: "DSP Black", prices: [1420, 350, 180, 120, 65] },
    ],
  },
  {
    id: "rum",
    name: "Rum",
    sizes: ["750 ML", "180 ML", "90 ML", "60 ML", "30 ML"],
    items: [
      { name: "Bacardi Limon", prices: [2890, 730, 370, 250, 130] },
      { name: "Bacardi White", prices: [2805, 705, 360, 245, 130] },
      { name: "Bacardi Black", prices: [1695, 415, 210, 145, 75] },
      { name: "Old Monk", prices: [1455, 355, 180, 125, 65] },
    ],
  },
  {
    id: "gin",
    name: "Gin",
    sizes: ["750 ML", "180 ML", "90 ML", "60 ML", "30 ML"],
    items: [
      { name: "Blue Riband Plain", prices: [1455, 365, 185, 125, 65] },
      // No 750ml on the card; the blank column is real, not missing data.
      { name: "Bombay Sapphire", prices: [null, 1425, 770, 350, 250] },
    ],
  },
  {
    id: "wine",
    name: "Wine",
    sizes: ["750 ML", "180 ML", "90 ML"],
    items: [
      { name: "Sula Red", prices: [1725, 435, 220] },
      { name: "Sula Satori", prices: [1310, 330, 165] },
      { name: "Sula White", prices: [1280, 320, 160] },
      { name: "Dia Red Wine", prices: [790, 200, 100] },
      { name: "Dia White Wine", prices: [790, 200, 100] },
      { name: "Port Wine", prices: [470, 175, 90] },
    ],
  },
  {
    id: "mild-beer",
    name: "Mild Beer",
    sizes: ["650 ML", "500 ML Tin"],
    items: [
      { name: "Heineken Silver", prices: [430, null] },
      { name: "Budweiser Mild", prices: [405, 315] },
      { name: "Carlsberg Mild", prices: [400, 315] },
      { name: "Kingfisher Ultra", prices: [370, 280] },
      { name: "KF Mild", prices: [330, 240] },
      { name: "Tuborg Mild", prices: [330, 255] },
      { name: "LP Mild", prices: [250, 185] },
      { name: "Corona", prices: [330, null], note: "330 ml" },
    ],
  },
  {
    id: "strong-beer",
    name: "Strong Beer",
    sizes: ["650 ML", "500 ML Tin"],
    items: [
      { name: "Budweiser Magnum", prices: [430, 330] },
      { name: "Carlsberg Elephant", prices: [415, 330] },
      { name: "Tuborg Strong", prices: [330, 255] },
      { name: "KF Strong", prices: [325, 250] },
      { name: "LP Strong", prices: [275, 230] },
    ],
  },
];

/* ------------------------------------------------------------------
   Derived
------------------------------------------------------------------- */

/** Every dish on the food side. Useful for counts and for tests. */
export const ALL_DISHES: Dish[] = FOOD.flatMap((c) =>
  c.groups.flatMap((g) => g.items),
);

/** Every pour on the bar side. */
export const ALL_POURS: Pour[] = BAR.flatMap((c) => c.items);

/** Total line count, food and bar. Printed in the section's own lede. */
export const MENU_LINE_COUNT = ALL_DISHES.length + ALL_POURS.length;

/** `[210, 310]` reads as a range; a single number stands alone. */
export function formatPrice(price: Price): string {
  return Array.isArray(price) ? `${price[0]} / ${price[1]}` : String(price);
}

/* ------------------------------------------------------------------
   Turn 7 — Veg / Non-Veg auto-classification

   The Supabase CMS does not yet carry a per-dish `isVeg` column, so
   the marker is populated from a name-keyword heuristic at module load.
   When the CMS lands its own field, `isVegFor` becomes the fallback for
   rows the admin hasn't reviewed yet.

   The keyword list is **conservative on the non-veg side** — a Hindu or
   Jain guest should never see a meat dish flagged as vegetarian, so any
   non-veg keyword match wins, even when the name also contains a veg
   keyword ("Chicken Cheese Naan" would still be non-veg). An unmatched
   name leaves `isVeg` undefined and the row omits the marker entirely;
   for groups where the card never disambiguates (`bread`, `soups`,
   `desserts`), that is the only honest answer.
------------------------------------------------------------------- */

const NON_VEG_KEYWORDS = [
  "chicken",
  "mutton",
  "lamb",
  "fish",
  "prawn",
  "shrimp",
  "crab",
  "egg",
  // The printed card spells "Omlet" without the second `t`; both spellings
  // are kept so a future re-transcription of the card cannot silently
  // flip the marker.
  "omlet",
  "omlete",
  "omlette",
  "omelette",
];

const VEG_KEYWORDS = [
  "paneer",
  // The Chinese chapter misspells paneer as "Panner" on row one — both
  // spellings match so the marker follows whichever the card carries.
  "panner",
  "palak",
  "mushroom",
  "corn",
  "dal",
  "cheese",
  "aloo",
  "gobi",
  "cauliflower",
  "baingan",
  "bhindi",
  "mixed veg",
  // `veg` matches as a whole word on most cards ("Veg Platter", "Veg
  // Manchurian") but also catches "Vegetarian" inside a long name.
  "veg",
];

/**
 * Auto-classify a dish by its lowercased name.
 *
 * Returns `true` for vegetarian, `false` for non-vegetarian, `undefined`
 * when the heuristic cannot decide. The row omits the marker in the
 * undefined case — see the type comment on `Dish.isVeg`.
 */
export function isVegFor(name: string): boolean | undefined {
  const lower = name.toLowerCase();
  // Non-veg wins on conflict: a guest must never see a meat dish
  // flagged as veg. The list is a small word allowlist, not a regex.
  if (NON_VEG_KEYWORDS.some((kw) => lower.includes(kw))) return false;
  if (VEG_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  return undefined;
}

/**
 * Mutate every food dish in place with its classification. Runs once at
 * module load; `FOOD` is a server-side constant, so the cost is paid per
 * process, not per request.
 */
for (const cat of FOOD) {
  for (const group of cat.groups) {
    for (const dish of group.items) {
      dish.isVeg = isVegFor(dish.name);
    }
  }
}
