# Bay Area Discounts

**[BayAreaDiscounts.com](https://bayareadiscounts.com)** — A searchable directory of free and low-cost programs across the San Francisco Bay Area.

Find benefits and discounts for:
- 💳 SNAP/EBT/Medi-Cal recipients
- 👵 Seniors (65+)
- 🧒 Youth
- 🎓 College students
- 🎖️ Veterans and active duty military
- 👨‍👩‍👧 Families and caregivers
- 🧑‍🦽 People with disabilities
- 🤝 Nonprofit organizations
- 🌎 Everyone

---

## 🎯 Project Goals

This community-driven resource aims to:
- **Improve awareness** of local programs and benefits
- **Support financial accessibility** across the Bay Area
- **Reduce stigma** around using assistance programs
- **Promote community engagement** and local exploration

---

## ✨ Features

- 🔍 **Smart Search** - Search by keyword, program name, or organization
- 🏷️ **Category Filters** - Browse by type (Food, Health, Transportation, Technology, etc.)
- 📍 **Location Filters** - Find programs by county or area
- 👥 **Eligibility Filters** - See only programs you qualify for
- ♿ **Accessibility Toolbar** - Font size, high contrast, dyslexia-friendly fonts, keyboard navigation
- 📱 **Mobile-Optimized** - Works great on phones, tablets, and computers
- 🌐 **Offline Support** - PWA (Progressive Web App) with service worker caching
- 🎨 **Dark Mode** - Automatic based on system preference

---

## 🛠️ Tech Stack

**Built with:**
- [Jekyll](https://jekyllrb.com/) - Static site generator
- [GitHub Pages](https://pages.github.com/) - Free hosting
- YAML - Structured data storage
- Vanilla JavaScript - Search, filters, and accessibility features
- Responsive CSS - Mobile-first design optimized for all devices including Apple Vision Pro

**Key Components:**
- `_data/programs/` - Program data organized by category (YAML files)
- `_includes/` - Reusable components (search UI, program cards, etc.)
- `_layouts/` - Page templates
- `assets/js/` - JavaScript for search/filter functionality
- `assets/css/` - Styling and responsive design

---

## 📂 Repository Structure

```
bayareadiscounts/
├── _data/
│   └── programs/          # Program data files (YAML)
│       ├── college-university.yml
│       ├── community.yml
│       ├── education.yml
│       ├── equipment.yml
│       ├── finance.yml
│       ├── food.yml
│       ├── health.yml
│       ├── legal.yml
│       ├── library_resources.yml
│       ├── pet_resources.yml
│       ├── recreation.yml
│       ├── technology.yml
│       ├── transportation.yml
│       └── utilities.yml
├── _includes/             # Reusable components
│   ├── program-card.html
│   └── search-filter-ui.html
├── _layouts/              # Page templates
│   └── default.html
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript
│   └── images/           # Logos, favicons
├── index.md              # Homepage
├── students.md           # Student-specific page
└── README.md
```

---

## 🎯 Scope & Focus

**This resource focuses on Bay Area programs.** National or statewide programs are included when they:
- Have specific Bay Area locations or chapters
- Provide significant value to Bay Area residents
- Are widely used and impactful (e.g., Museums for All)

**Geographic priority:**
1. **Bay Area-specific** programs (preferred)
2. **California statewide** programs available to Bay Area residents
3. **National programs** with Bay Area presence or significant local impact

---

## 🤝 How to Contribute

We welcome contributions! There are two ways to help:

### For Everyone: Submit a Program
**Found a resource that should be listed?**  
👉 [Open an issue](../../issues/new) with:
- Program/service name
- Who it helps (eligibility)
- What benefit it provides
- Official website link
- Location/area served
- Any deadlines or special requirements

### For Technical Contributors
**Want to add programs directly or improve the site?**  
👉 See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for detailed technical instructions

---

## 🚀 Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/yourusername/bayareadiscounts.git
cd bayareadiscounts

# Install dependencies
bundle install

# Run local server
bundle exec jekyll serve

# View at http://localhost:4000
```

---

## 📊 Data Structure

Programs are stored in YAML files under `_data/programs/`. Each program follows this format:

```yaml
- id: "unique-program-id"
  name: "Program Name"
  category: "Category Name"
  area: "Geographic Area"
  eligibility:
    - "💳"  # SNAP/EBT/Medi-Cal
    - "👵"  # Seniors
  benefit: "Description of what the program provides"
  timeframe: "Ongoing"
  link: "https://official-website.com"
  link_text: "Apply"
```

### Available Categories:
- Childcare Assistance
- Clothing Assistance
- Community Services
- Education
- Equipment
- Finance
- Food
- Health
- Legal Services
- Library Resources
- Museums
- Pet Resources
- Public Transit
- Recreation
- Tax Preparation
- Technology
- Transportation
- Utilities

### Eligibility Emojis:
- 💳 = SNAP/EBT/Medi-Cal recipients
- 👵 = Seniors (65+)
- 🧒 = Youth
- 🎓 = College students
- 🎖️ = Veterans/Active duty
- 👨‍👩‍👧 = Families & caregivers
- 🧑‍🦽 = People with disabilities
- 🤝 = Nonprofit organizations
- 🌎 = Everyone

---

## 🔄 Maintenance & Updates

This is a **community-maintained project**. Programs are verified periodically, but:
- ⚠️ **Always check the official website** for the most current information
- 📅 Availability and eligibility requirements can change
- 🔗 If you find outdated info, please [open an issue](../../issues/new)

---

## 🙏 Acknowledgments

This project is maintained by volunteers who believe in making community resources more accessible. Special thanks to:
- All contributors who submit programs and updates
- Organizations providing these valuable services
- The open-source community for the tools that make this possible

---

## 📝 License

This project is open source and available for public use. You are welcome to:
- Share and link to this resource
- Fork and adapt for your own community
- Contribute improvements and additions

**Please provide credit when reusing or adapting this work.**

---

## 💖 Support This Project

If this resource has helped you save money or discover new opportunities:

**[☕ Buy Me a Coffee](https://buymeacoffee.com/bayareadiscounts)**

Your support helps maintain and improve this free community resource.

---

## 📧 Contact

- 🐛 **Found a bug?** [Open an issue](../../issues/new)
- 💡 **Have a suggestion?** [Start a discussion](../../discussions)
- 📬 **Other inquiries:** Create an issue and we'll respond

---

**Last Updated:** December 14, 2025 
**Maintained by:** [semicoloncolonel](https://github.com/semicoloncolonel) 
**Hosted on:** GitHub Pages
