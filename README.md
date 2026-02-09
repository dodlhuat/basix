# Basix 1.0.0

Basix is intended as a starter for the rapid development of a design. Each design element can be added individually to
include only the data required. It is using plain javascript / typescript and therefore is not dependent on any plugin.

A demo can be found here: <a href="http://www.andibauer.at/basix/" target="_blank">http://www.andibauer.at/basix/</a>

### Benefits

* lightweight
* customizable
* no dependencies, completely vanilla javascript (or css only)

## Usage

Take a look at style.scss for a glimpse on a full import. reset, parameters, colors & defaults are mandatory, anything
else can be added as needed.

To use the import functionality of javascript files you need to import your main script as a module. And either build
your own css or include the existing full style.css (or min)

``` html
<link rel="stylesheet" href="css/style.css" type="text/css">
<script src="js/index.js" type="module"></script>
```

---

# Available Components

## Layout

### Grid System

The Grid component provides a flexbox-based layout system. Use `.row` with `.column` children. Columns can use `.grow-2` through `.grow-6` for proportional sizing. Responsive — stacks on mobile.

``` html
<div class="row">
    <div class="column">Column 1</div>
    <div class="column grow-2">Column 2 (2x)</div>
    <div class="column">Column 3</div>
</div>
```

### Typography

The typography system is built around the Outfit variable font, providing a modern, readable base for all text. Headings follow a clear scale with bold weight and tighter line spacing for strong visual hierarchy. Utility classes enable simple text alignment. Monospace fonts are reserved for code.

### Cards

The Card component is a CSS-only component that creates visually contained content sections with optional header and footer. Use `.card` on rows or columns to wrap them into a card.

``` html
<div class="row card">
    <div class="column">Card content</div>
</div>
```

### Icons

Basix uses a reduced Google Material Icon font with just a minimum set of icons. The reduced version is only 5.5 KB compared to the full 242.5 KB. Use the `icon` class with the desired icon element class.

``` html
<span class="icon icon-home"></span>
```

---

## Forms

The Form styles provide consistent styling for inputs, textareas, and native elements.

### Text Input

``` html
<label for="my-input">Text Input</label>
<input type="text" id="my-input" />
```

### Textarea

``` html
<label for="my-textarea">Text Area</label>
<textarea id="my-textarea"></textarea>
```

### Checkbox

The Checkbox component provides custom-styled checkboxes.

``` html
<input class="styled-checkbox" id="checkbox-1" type="checkbox" value="1" />
<label for="checkbox-1">Checkbox</label>
```

### Radio Buttons

The Radio Button component provides custom-styled radio inputs.

``` html
<label class="radio-button-container">One
    <input type="radio" checked="checked" name="radio" />
    <span class="checkmark"></span>
</label>
```

### Switch

The Switch component creates styled toggle switches based on checkboxes.

``` html
<div class="switch">
    <input type="checkbox" id="switch" />
    <label for="switch">Toggle</label>
</div>
```

### Range Slider

The Range Slider component creates a simple styled slider.

``` html
<input type="range" min="1" max="100" value="50" />
```

---

## Navigation

### Push Menu

The PushMenu component creates a sidebar navigation that "pushes" the main content when opened. Uses a checkbox-based toggle mechanism.

### Flyout Menu

The Flyout Menu component creates slide-in navigation menus with nested submenus. Supports left/right direction, header/footer and keyboard navigation (Escape to close).

| Option | Type | Default | Description |
|---|---|---|---|
| `triggerSelector` | string | `'.menu-trigger'` | CSS selector for the element(s) that open the menu |
| `menuSelector` | string | `'#flyoutMenu'` | CSS selector for the flyout menu element |
| `overlaySelector` | string | `'#flyoutOverlay'` | CSS selector for the backdrop overlay |
| `closeSelector` | string | `'.close-menu'` | CSS selector for close button(s) inside the menu |
| `direction` | string | `'right'` | Slide-in direction, either `'right'` or `'left'` |
| `title` | string | `'Menu'` | Shown in the header if enabled |
| `enableHeader` | boolean | `true` | Shows the menu header |
| `footerText` | string | `'© 2025 Brand Inc.'` | Shown in the footer if enabled |
| `enableFooter` | boolean | `true` | Shows the menu footer |

### Dropdown Menu

The Dropdown Menu allows to create multi-level dropdown menus with nested submenus. The menu fires custom events `CustomEvent<DropdownSelectDetail>` that can be listened to in order to react to user selections.

``` html
<div class="dropdown-container" id="myDropdown">
    <button class="dropdown-trigger">Select Option</button>
    <ul class="dropdown-menu">
        <li><div class="dropdown-item">Profile</div></li>
        <li>
            <div class="dropdown-item">Settings</div>
            <ul>
                <li><div class="dropdown-item">Account</div></li>
            </ul>
        </li>
    </ul>
</div>
```

---

## Feedback

### Modal

The Modal component creates dialog overlays with header, content, and footer sections. Supports types (success, error, warning, info) and close on Escape key.

| Parameter | Type | Description |
|---|---|---|
| `content` | string | Content of the modal. Can be HTML or a simple string |
| `header` | string | Header of the modal. Can be HTML or a simple string |
| `footer` | string | Footer of the modal. Can be HTML or a simple string |
| `closeable` | boolean | Shows a close button |
| `type` | ModalType | The type of the modal (success, error, warning, info, default) |

### Toast

The Toast component shows brief notification messages.

| Parameter | Type | Description |
|---|---|---|
| `content` | string | The content of the toast |
| `header` | string | The header of the toast |
| `markup` | ToastType | Changes the color of the toast: default, success, warning, error |
| `closeable` | boolean | Allows to close the toast before auto-closure time |
| `auto-closure` | integer | Optional closure time in ms |

### Tooltip

The Tooltip component shows contextual information on hover.

``` html
<button class="tooltip-trigger" data-tooltip="This is a simple tooltip">Hover me</button>
```

### Spinner / Loading

The Spinner component shows simple loading indicators. There are two variants: a simple spinner and a loading indicator with dots.

``` html
<div class="spinner"></div>
<div class="loading"></div>
```

---

## Components

### Alerts

The Alert component displays contextual feedback messages. Available variants: default, error, warning and success.

``` html
<div class="alert alert-error"><strong>Error: </strong> This is an error alert!</div>
```

### Buttons

The Button component provides styled buttons with variants. Use the `.button` class on divs or simply the `button` element with color classes: `button-primary`, `button-success`, `button-warning`, `button-error`.

``` html
<button class="button-primary">Primary</button>
```

### Chips

The Chips component displays small interactive elements like tags or filters. CSS only. Use listeners if you want them to be clickable or closeable.

``` html
<div class="chips">
    <div class="chip">Example Chip</div>
    <div class="chip clickable">Clickable Chip</div>
    <div class="chip closeable">
        Closeable Chip
        <button class="close"><span class="icon icon-close"></span></button>
    </div>
</div>
```

### Accordion

The Accordion component creates collapsible content sections. Uses hidden radio/checkbox inputs with labels and is CSS only.

``` html
<div class="accordion">
    <div class="accordion-item">
        <input type="radio" name="accordion" id="acc1" class="accordion-input" checked />
        <label for="acc1" class="accordion-label">Section Title</label>
        <div class="accordion-content">
            <div class="accordion-body"><div><p>Content here.</p></div></div>
        </div>
    </div>
</div>
```

### Tabs

The Tabs component creates accessible tabbed interfaces. Supports horizontal/vertical layouts, keyboard navigation (arrow keys, Home, End), and ARIA attributes.

| Option | Type | Default | Description |
|---|---|---|---|
| `layout` | string | `'horizontal'` | Layout of the tabs, either `'horizontal'` or `'vertical'` |
| `defaultTab` | integer | `0` | Index of the default active tab (0-based) |

### Timeline

The Timeline component displays chronological events. CSS only.

``` html
<div class="timeline">
    <div class="timeline-item active">
        <div class="timeline-content">
            <span class="timeline-date">October 12, 2023</span>
            <h3 class="timeline-title">Event Title</h3>
            <p class="timeline-body">Event description.</p>
        </div>
    </div>
</div>
```

### Progress Bar

The Progress Bar component displays task completion.

``` html
<div class="progress-bar">
    <div class="progress" style="height: 24px; width: 50%"></div>
</div>
```

### Placeholder / Skeleton

The Placeholder component creates skeleton loading states. Use `.placeholder` with width classes `.w-1` through `.w-12` (12-column grid). Animates with a pulsing fade effect.

``` html
<span class="placeholder w-6"></span>
```

---

## Advanced Components

### Data Tables

The Table component provides sortable, searchable, and paginated data tables. It can parse existing HTML tables or accept data programmatically.

### Date Picker

The DatePicker component provides a calendar interface for date selection. Supports single date or date range modes, customizable locales, and mobile-responsive design.

#### DatePicker Parameters

| Parameter | Type | Description |
|---|---|---|
| `input` | HTMLInputElement \| string | The input element to attach the date picker to |
| `options` | DatePickerOptions | Configuration options for the date picker (see options table) |
| `currentDate` | Date | The current date to be displayed; defaults to today's date |
| `selectedDate` | Date | The selected date; defaults to null |
| `rangeStart` | Date | The start of a selected date range; defaults to null |
| `rangeEnd` | Date | The end of a selected date range; defaults to null |
| `viewYear` | number | The year currently displayed; defaults to the current year |
| `viewMonth` | number | The month currently displayed; defaults to the current month |
| `viewMode` | ViewMode | The view mode (`'days'` \| `'months'` \| `'years'`); defaults to `'days'` |
| `yearRangeStart` | number | The start of the year range; defaults to this year |

#### DatePickerOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `mode` | string | `'single'` | Mode of the date picker, either `'single'` or `'range'` |
| `startDay` | number | `0` | Start day of the week (0 = Sunday, 1 = Monday, etc.) |
| `locales` | DatePickerLocales | — | Locales object containing a `days` array and a `months` array with localized names |
| `format` | `(date: Date) => string` | — | Function to format the date for display; defaults to `'YYYY-MM-DD'` |
| `onSelect` | `(date: Date \| DateRange) => void` | — | Callback when a date is selected |

### Tree Component

The TreeComponent renders hierarchical data as an expandable/collapsible tree. Supports file/folder icons, selection, and programmatic expand/collapse.

#### TreeComponent Parameters

| Parameter | Type | Description |
|---|---|---|
| `container` | HTMLElement \| string | The container element |
| `data` | TreeNode[] | An array of TreeNodes to render |
| `selectedNode` | TreeNode \| null | The currently selected TreeNode |

#### TreeNode

| Parameter | Type | Description |
|---|---|---|
| `label` | string | The label of the TreeNode |
| `type` | NodeType | The type of the TreeNode: `'file'` \| `'folder'` |
| `children` | TreeNode[] | An array of child TreeNodes |

### File Uploader

The FileUploader component provides drag-and-drop file upload functionality with progress indication. Supports file validation (size, type), multiple files, and upload cancellation.

### Virtual Dropdown

Virtual Dropdown is a performant, virtualized dropdown component that efficiently renders large option lists by only drawing visible items in the DOM. Supports single and multi-select modes, built-in search/filtering, keyboard navigation, and configurable item height and render limits — making it ideal for scenarios with hundreds or thousands of selectable options.

### Custom Scrollbar

The Scrollbar component creates custom-styled scrollbars. Supports pointer/touch dragging, track clicking, and automatic thumb sizing. Can be used with any class.

``` html
<div class="scroll-container" style="height: 100px">
    <div class="viewport">
        <div class="content">...</div>
        <div class="scrollbar" aria-hidden="true">
            <div class="track">
                <div class="thumb" role="presentation" aria-hidden="true"></div>
            </div>
        </div>
    </div>
</div>
```

### Chat Bubbles

The Chat Bubbles component styles messaging interfaces.

``` html
<div class="chat-container">
    <div class="message message-incoming">
        Hello!
        <span class="message-meta">10:42 AM</span>
    </div>
    <div class="message message-outgoing">
        Hi there!
        <span class="message-meta">10:43 AM</span>
    </div>
</div>
```

### Carousel

The Carousel component creates image/content sliders with navigation buttons and dot indicators. Supports loop mode, autoplay, and touch/swipe gestures.

``` html
<div class="carousel" id="carouselIdHere">
    <div>Slide 1</div>
    <div>Slide 2</div>
    <div>Slide 3</div>
</div>
```

### Gallery

A responsive, infinite-scroll masonry gallery that dynamically arranges image cards into columns. The layout automatically adapts to the viewport width, redistributing items into the shortest column for a balanced, Pinterest-style grid. Cards feature lazy-loaded images with a smooth fade-in effect, titles, and descriptions. Scroll to the bottom to load more content — fetching can be throttled with a configurable reload limit to prevent runaway requests.

#### Constructor Parameters

| Parameter | Type | Description |
|---|---|---|
| `containerId` | string | The `id` of the HTML element that will serve as the gallery container. Throws an error if not found in the DOM. |
| `options` | MasonryGalleryOptions | Optional configuration object to customise the gallery's layout and behaviour. Defaults to `{}`. |

#### MasonryGalleryOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `minColumnWidth` | number | `250` | Minimum width (in pixels) for each masonry column. The number of columns is calculated by dividing the available container width by this value. |
| `scrollThreshold` | number | `100` | Distance from the bottom of the page (in pixels) at which the next batch of images is fetched. |
| `loaderSelector` | string | `'.loader'` | CSS selector for the loading-indicator element. Shown/hidden automatically during fetch cycles via a `hidden` class toggle. |
| `reload` | number | `2` | Maximum number of times new images can be fetched via infinite scroll. Once the limit is reached, further scroll events are ignored. |
| `fetchFunction` | `Promise<ImageData[]>` | — | A promise that resolves to an array of `ImageData` objects (`{ src, title, desc }`). Required in practice — the built-in fallback throws an error. |

---

## Utilities

### Theme Toggle

The Theme component manages light/dark mode switching. Persists preference to localStorage, respects system preference, and supports keyboard shortcut (Ctrl/Cmd+J). Any element with id `theme-toggle` can work as a switch.

### Scroll Utility

The Scroll utility allows to scroll to elements in the DOM. You can scroll to any class or id element.

``` js
window.Scroll.to('#my-element');
```
