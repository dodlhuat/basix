import { utils } from "./utils.js";
import { Select } from "./select.js";
import { Scrollbar } from "./scrollbar.js";
import { Modal } from "./modal.js";
import { PushMenu } from "./push-menu.js";
import { Toast } from "./toast.js";
import { DatePicker } from "./datepicker.js";
import { Theme } from "./theme.js";
import { Table, TableColumn, TableRow } from "./table.js";
import { FlyoutMenu } from "./flyout-menu.js";
import { Tabs } from "./tabs.js";
import { Carousel } from "./carousel.js";
import { CodeViewer } from "./code-viewer.js";
import { FileUploader } from "./file-uploader.js";
import { TreeComponent, TreeNode } from "./tree.js";
import { MasonryGallery, ImageData } from "./gallery.js";
import { Tooltip } from "./tooltip.js";
import { Dropdown, DropdownSelectDetail } from "./dropdown.js";
import { VirtualDropdown } from "./virtual-dropdown.js";

// Generate sample table data
const generateData = (count: number): TableRow[] => {
  const data: TableRow[] = [];
  const firstNames = [
    "John",
    "Jane",
    "Mike",
    "Sarah",
    "Robert",
    "Emily",
    "David",
    "Emma",
    "James",
    "Olivia",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
  ];
  const roles = ["Admin", "User", "Editor", "Viewer", "Manager", "Developer"];
  const statuses = ["Active", "Inactive", "Pending", "Banned"];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const lastLoginDate = new Date(
      Date.now() - Math.floor(Math.random() * 10000000000),
    );

    data.push({
      id: i,
      name: `${firstName} ${lastName}`,
      email: `user${i}@example.com`,
      role,
      status,
      lastLogin: lastLoginDate.toLocaleDateString(),
    });
  }

  return data;
};

// Initialize all components when DOM is ready
utils.ready(() => {
  // Initialize scrollbars
  Scrollbar.initAll(".scroll-container");

  // Initialize theme
  Theme.init();

  // Initialize basic table
  new Table("#demo-table", { pageSize: 5 });

  // Initialize horizontal tabs
  const horizontalTabs = new Tabs(".horizontal", {
    layout: "horizontal",
  });

  // Initialize vertical tabs
  const verticalTabs = new Tabs(".vertical", {
    layout: "vertical",
  });

  // Initialize carousel
  const carousel = new Carousel("#carouselIdHere", {
    loop: true,
  });

  // Initialize advanced table with data
  const columns: TableColumn[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "lastLogin", label: "Last Login" },
  ];

  const tableData = generateData(50);
  new Table("#demo-table-js", {
    data: tableData,
    columns: columns,
    pageSize: 10,
  });

  // Initialize select components
  new Select("#single-select");
  new Select("#multi-select");

  // Initialize modal
  const modalTrigger = document.querySelector(".show-modal");
  if (modalTrigger) {
    modalTrigger.addEventListener("click", () => {
      const buttons =
        '<div class="buttons"><button class="button-light">Close</button>&nbsp;<button>Save Changes</button></div>';
      const modal = new Modal(
        "bluffi",
        "<strong>blaffi</strong>",
        buttons,
        true,
        "default",
      );
      modal.show();

      console.warn("Buttons have no bound listeners");
    });
  }

  // Initialize toast
  const toastTrigger = document.querySelector(".show-toast");
  if (toastTrigger) {
    toastTrigger.addEventListener("click", () => {
      const toast = new Toast(
        "some content. maybe even more text in here!",
        "some header",
        "success",
        true,
      );
      toast.show(3000);
    });
  }

  // Initialize push menu
  PushMenu.init();

  // Initialize flyout menu
  const menu = new FlyoutMenu({
    direction: "right",
    triggerSelector: ".trigger-flyout-menu",
  });

  // Flyout menu controls: Switch direction
  const directionBtns = document.querySelectorAll<HTMLButtonElement>(
    ".flyout-controls > button",
  );
  directionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      directionBtns.forEach((b) => b.classList.remove("active"));

      // Add active class to clicked button
      btn.classList.add("active");

      // Update menu direction
      const direction = btn.dataset.direction as "left" | "right" | undefined;
      if (direction) {
        menu.setDirection(direction);
      }
    });
  });

  // Initialize single date picker
  new DatePicker("#datepicker-single", {
    mode: "single",
    onSelect: (date) => {
      console.log("Single selected:", date);
    },
  });

  // Initialize range date picker
  new DatePicker("#datepicker-range", {
    mode: "range",
    onSelect: (range) => {
      console.log("Range selected:", range);
    },
  });

  // Initialize localized date picker
  new DatePicker("#datepicker-localized", {
    mode: "single",
    startDay: 1, // Monday
    locales: {
      days: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
      months: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ],
    },
    format: (date) => {
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    onSelect: (date) => {
      console.log("Localized selected:", date);
    },
  });

  // Initialize code viewer with usage example
  const usageTabs = `new Tabs('.horizontal', {
    layout: 'horizontal',
    defaultTab: 0
});`;

  new CodeViewer("#usage-tabs", usageTabs, "js");

  // Initialize file uploader
  const uploaderElement =
    document.querySelector<HTMLElement>(".uploader-content");
  if (uploaderElement) {
    new FileUploader(uploaderElement);
  }

  const sampleData: TreeNode[] = [
    new TreeNode("Documents", "folder", [
      new TreeNode("Work", "folder", [
        new TreeNode("presentation.pptx", "file"),
        new TreeNode("report.docx", "file"),
        new TreeNode("budget.xlsx", "file"),
      ]),
      new TreeNode("Personal", "folder", [
        new TreeNode("resume.pdf", "file"),
        new TreeNode("vacation-photos", "folder", [
          new TreeNode("beach.jpg", "file"),
          new TreeNode("mountain.jpg", "file"),
        ]),
      ]),
    ]),
    new TreeNode("Projects", "folder", [
      new TreeNode("website", "folder", [
        new TreeNode("index.html", "file"),
        new TreeNode("styles.css", "file"),
        new TreeNode("script.js", "file"),
      ]),
      new TreeNode("app", "folder", [
        new TreeNode("src", "folder", [
          new TreeNode("main.js", "file"),
          new TreeNode("utils.js", "file"),
        ]),
        new TreeNode("package.json", "file"),
      ]),
    ]),
    new TreeNode("Downloads", "folder", [
      new TreeNode("installer.exe", "file"),
      new TreeNode("readme.txt", "file"),
    ]),
    new TreeNode("README.md", "file"),
  ];
  const tree = new TreeComponent("#tree-root", sampleData);

  const batchSize = 12;
  let indexNumber = 1;
  const gallery = new MasonryGallery("gallery", {
    minColumnWidth: 300,
    fetchFunction: new Promise((resolve) => {
      setTimeout(() => {
        const images: ImageData[] = [];

        for (let i = 0; i < batchSize; i++) {
          const width = 400;
          const height = Math.floor(Math.random() * 301) + 300; // 300-600
          const id = Math.floor(Math.random() * 1000);
          const imageIndex = indexNumber * batchSize + i;

          images.push({
            src: `https://picsum.photos/${width}/${height}?random=${imageIndex}`,
            title: `Image ${imageIndex + 1}`,
            desc: `A random caption for image ${id}`,
          });
        }

        indexNumber++;
        resolve(images);
      }, 800);
    }),
  });

  const dropdown = new Dropdown("#myDropdown");
  const dropdownElement = document.querySelector("#myDropdown");
  dropdownElement?.addEventListener("dropdown-select", ((
    event: CustomEvent<DropdownSelectDetail>,
  ) => {
    const { text, element } = event.detail;
    console.log("User selected:", text);
    console.log("Selected element:", element);
  }) as EventListener);

  const generateItems = (count: number, prefix: string) => {
    return Array.from({ length: count }, (_, i) => ({
      label: `${prefix} Item ${i + 1}`,
      value: `${prefix.toLowerCase()}_${i + 1}`,
    }));
  };

  const bigData = generateItems(10000, "Option");
  const smallData = generateItems(50, "Choice");

  const singleDropdown = new VirtualDropdown({
    container: "#dropdown-single",
    options: bigData,
    searchable: true,
    placeholder: "Search 10k items...",
    renderLimit: 15,
    onSelect: (val) => {
      console.log("Single Select:", val);
    },
  });

  const multiDropdown = new VirtualDropdown({
    container: "#dropdown-multi",
    options: smallData,
    searchable: true,
    multiSelect: true,
    placeholder: "Choose multiple...",
    renderLimit: 10,
    onSelect: (vals) => {
      console.log("Multi Select:", vals);
    },
  });

  Tooltip.initializeAll();

  new CodeViewer(
    "#usage-text-input",
    `<label for="text-input-demo">Text Input</label>
<input type="text" id="text-input-demo"/>`,
    "html",
  );
  new CodeViewer(
    "#usage-textarea",
    `<label for="textarea-demo">Text Area</label>
<textarea id="textarea-demo"></textarea>`,
    "html",
  );
  new CodeViewer(
    "#usage-checkbox-demo",
    `<input class="styled-checkbox"
    id="checkbox-1"
    type="checkbox"
    value="1"
/>
<label for="checkbox-1">Checkbox</label>`,
    "html",
  );
});
new CodeViewer(
  "#usage-radiobutton-demo",
  `<label class="radio-button-container">Three
    <input type="radio" name="radio"/>
    <span class="checkmark"></span>
</label>`,
  "html",
);
new CodeViewer(
  "#usage-switch-demo",
  `<div class="switch">
    <input type="checkbox" id="switch"/><label for="switch">Toggle</label>
</div>`,
  "html",
);
new CodeViewer(
  "#usage-slider-demo",
  `<label for="range-slider" class="hidden">Slider</label>
<input
    type="range"
    min="1"
    max="100"
    value="50"
    id="range-slider-demo"
/>`,
  "html",
);
new CodeViewer(
  "#usage-pushmenu-control-demo",
  `<div class="open-menu">
    <div class="navigation-controls">
        <input type="checkbox" id="menu-navigation" class="navigation"/>
        <label for="menu-navigation">
            <span class="icon icon-menu"></span>
        </label>
    </div>
</div>`,
  "html",
);
new CodeViewer(
  "#usage-pushmenu-demo",
  `<nav class="push-menu">
    <ul>
        <li>
            <a onclick="window.Scroll.to('#grid')">Grid</a>
        </li>
        <li>
            <a onclick="window.Scroll.to('#typography')">Typography</a>
        </li>
    </ul>
</nav>`,
  "html",
);
new CodeViewer("#usage-pushmenu-script-demo", `PushMenu.init();`, "js");
new CodeViewer(
  "#usage-flyout-script-demo",
  `const menu = new FlyoutMenu({
  direction: "right",
  triggerSelector: ".trigger-flyout-menu",
});`,
  "js",
);
new CodeViewer(
  "#usage-flyout-demo",
  `<div class="flyout-overlay" id="flyoutOverlay"></div>
<div class="flyout-menu" id="flyoutMenu">
    <ul>
        <li><a href="#">Home</a></li>
        <li>
            About
            <ul>
                <li><a href="#">Our Story</a></li>
                <li><a href="#">Team</a></li>
                <li><a href="#">Careers</a></li>
            </ul>
        </li>
        <li>
            Services
            <ul>
                <li>
                    Web Design
                    <ul>
                        <li><a href="#">eCommerce</a></li>
                        <li><a href="#">Landing Pages</a></li>
                        <li><a href="#">Portfolios</a></li>
                    </ul>
                </li>
                <li><a href="#">Development</a></li>
                <li><a href="#">SEO</a></li>
            </ul>
        </li>
        <li><a href="#">Portfolio</a></li>
        <li><a href="#">Contact</a></li>
    </ul>
</div>`,
  "html",
);
new CodeViewer(
  "#usage-dropdown-menu-demo",
  `<div class="dropdown-container" id="myDropdown">
  <button class="dropdown-trigger">Select Option</button>
  <ul class="dropdown-menu">
    <li>
      <div class="dropdown-item">Profile</div>
    </li>
    <li>
      <div class="dropdown-item">Settings</div>
      <ul>
        <li>
          <div class="dropdown-item">Account</div>
        </li>
        <li>
          <div class="dropdown-item">Privacy</div>
          <ul>
            <li>
              <div class="dropdown-item">Public</div>
            </li>
            <li>
              <div class="dropdown-item">Private</div>
            </li>
            <li>
              <div class="dropdown-item">Friends Only</div>
            </li>
          </ul>
        </li>
        <li>
          <div class="dropdown-item">Notifications</div>
        </li>
      </ul>
    </li>
    <li>
      <div class="dropdown-item">Help</div>
    </li>
    <li>
      <div class="dropdown-item">Logout</div>
    </li>
  </ul>
</div>`,
  "html",
);
new CodeViewer(
  "#usage-dropdown-menu-js-demo",
  `const dropdown = new Dropdown("#myDropdown");
const dropdownElement = document.querySelector("#myDropdown");
dropdownElement?.addEventListener("dropdown-select", ((
  event: CustomEvent<DropdownSelectDetail>,
) => {
  const { text, element } = event.detail;
  console.log("User selected:", text);
  console.log("Selected element:", element);
}) as EventListener);`,
  "js",
);
new CodeViewer(
  "#usage-modal-demo",
  `const modal = new Modal(
  "content",
  "<strong>header</strong>",
  "controls",
  true,
  "default",
);
modal.show();`,
  "js",
);
new CodeViewer(
  "#usage-toast-demo",
  `const toast = new Toast(
    "some content. maybe even more text in here!",
    "some header",
    "success",
    true,
  );
  toast.show(3000);`,
  "js",
);
new CodeViewer(
  "#usage-tooltip-demo",
  `<button class="tooltip-trigger" data-tooltip="This is a simple tooltip">
  Simple Tooltip
</button>`,
  "html",
);
new CodeViewer(
  "#usage-tooltip-js-demo",
  `Tooltip.initializeAll();`,
  "js",
);
new CodeViewer(
  "#usage-spinner-demo",
  `<div class="spinner"></div>`,
  "html",
);
new CodeViewer(
  "#usage-loading-demo",
  `<div class="loading"></div>`,
  "html",
);