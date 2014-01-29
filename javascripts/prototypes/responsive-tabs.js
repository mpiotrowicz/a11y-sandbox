/* global Handlebars */

(function () {
  var Tabs;

  Tabs = (function () {

    var templates = {
      tplTabNav: Handlebars.compile("<ul class='inline-list tabs-navigation show-desktop' role='tablist'>{{#each tab}}<li role='presentation' class='tab-menu-item'><button data-id='{{tabId}}' id='TabController-{{tabId}}' class='txt-btn' role='tab' aria-selected='false' aria-controls='{{tabId}}' tabindex=-1>{{tabTitle}}</button></li>{{/each}}</ul>")
    };

    /**
     * Sets up the Tabs
     *
     * @param $container - parent of the items that will be tabbed together
     * @param $options - any overrides to the classes set below
     */
    function Tabs($container, options) {
      // set all the classes
      var defaults = {
        default_tab: "0", // the eq() value of the default tab to open on page load
        tab_class_panel: ".tabs-container__panel", // parent of the tab detail + tab title element
        tab_class_panel_open: "tabs-container__panel--current", // class for tab container when the tab is open
        tab_class_title: ".tabs-container__title", // the class of the title for each tab, added usually to an h3 element
        tab_nav_id: "TabNav", // ID for the tab navigation
        tab_nav_class_open: "tabs-navigation__item--current", // class for navigation when associated tab is open
        accordion: {
          closed_class: "accordion--closed" // since the accordion can be closed for all tabs, extra class for just closing the accordion, even if the tab is technically active
        }
      };

      this.$container = $container.addClass("tabs-init");
      this.options = $.extend({}, defaults, options);
      this.currentTab = null;
      this.init();

    }

    /**
     * Creates a data object for all tabs within the widget
     * Saves each Tab ID and title
     * While it's iterating through the tabs, prepares the Aria roles as well
     */
    Tabs.prototype.fetchTabData = function () {
      // array to store the data for all tabs in the widget
      this.tabData = [];
      var i = 0,
        $tab_panels = this.$tab_panels,
        len = $tab_panels.length,
        $currentPanel,
        currentPanelData;

      // for each of the tabs, fetch its title and ID from the HTML and save to a data object for that tab
      for (i; i < len; i++) {
        $currentPanel = $($tab_panels[i]);
        currentPanelData = {
          tabId: $tab_panels[i].id,
          tabTitle: $currentPanel.data("title")
        };

        // save the data to an array of all tab data. The array will be used to construct the navigation
        this.tabData.push(currentPanelData);

        // witin the tab, find the details and update the Aria attributes
        $currentPanel.attr({
          //"aria-labelledby": "TabController-" + $tab_panels[i].id,
          "aria-labelledby": "TabPanelTitle-" + $tab_panels[i].id,
          "role": "tabpanel",
          "aria-hidden": "true"
        });

        // witin the tab, find the title and update the Aria attributes
        // next, append the required icon to the title, used on tablet and mobile
        $currentPanel.prev(this.options.tab_class_title)
          .attr({
            "tabindex": "-1",
            "role": "tab",
            "aria-selected": "false",
            "aria-controls": $tab_panels[i].id
          });
      }
    };

    /**
     * Builds the HTML for the tabbed navigation, for use in desktop only if there's more than 1 element to be tabbed
     */
    Tabs.prototype.createTabNav = function () {
      this.tabNav = true;
      // use the tabData object to construct the buttons needed for the tab navigation, and append it to the container
      this.$tabNav = $(templates.tplTabNav({
        "tab": this.tabData
      })).prependTo(this.$container);

      // save the reference of the navigation
      this.$tabNavItems = this.$tabNav.find("button");
      // add class to indicate that there's a navigation
      this.$container.addClass("tabs-nav-init");
    };

    /**
     * Binds the navigation events
     */
    Tabs.prototype.bindNavEvents = function () {
      var app = this;

      this.$tabNav.on("click", "button", function (e) {
        e.preventDefault();
        var $target = $(e.currentTarget),
          $tabPanel = $(document.getElementById($target.data("id")));
        if (!app.isCurrentTab($tabPanel)) {
          app.closeTab();
          app.openTab($tabPanel);
          app.currentTab.$navItem.focus(); // focus here so doesn't steal focus on page load
        }
      });

      this.$tabNav.on("keydown", "button", function (e) {
        var currentIndex = app.keyHandler(e);
        if (currentIndex !== null) {
          app.closeTab();
          var panelId = app.tabData[currentIndex].tabId;
          app.openTab($(document.getElementById(panelId)));
          app.currentTab.$navItem.focus();// focus here so doesn't steal focus on page load
          //console.log("should be focus");
        }
      });
    };

    /**
     * Updates the dynamically created tab nav in desktop once a new tab has been opened
     * @param $tab - jQuery element for the tab that was just opened
     */
    Tabs.prototype.updateTabNav = function () {
      var currentTab = this.currentTab;
      //console.log(currentTab);

      currentTab.$navItem = this.$tabNavItems.eq(currentTab.position).addClass(this.options.tab_nav_class_open);
      currentTab.$navItem
        .attr({
          "tabindex": "0",
          "aria-selected": "true"
        });
    };

    /**
     * Key handler for tabs - allows arrow navigation
     */
    Tabs.prototype.keyHandler = function (e) {
      var keyCodes,
        currentIndex = this.currentTab.position;
      keyCodes = {
        DOWN: 40,
        ENTER: 13,
        ESCAPE: 27,
        HOME: 36,
        LEFT: 37,
        PAGE_DOWN: 34,
        PAGE_UP: 33,
        RIGHT: 39,
        SPACE: 32,
        TAB: 9,
        UP: 38
      };

      // disabling key down and key up due to UAT request where scrolling page with keys would change tabs
      switch (e.keyCode) {
        case keyCodes.LEFT:
        case keyCodes.UP:
          currentIndex--;
          if (currentIndex < 0) {
              currentIndex = this.tabData.length - 1;
          }
          //console.log(currentIndex);
          break;
        case keyCodes.END:
          currentIndex = this.tabData.length - 1;
          break;
        case keyCodes.HOME:
          currentIndex = 0;
          break;
        case keyCodes.SPACE:
        case keyCodes.ENTER:
          //if (actualIndex != currentIndexconsole.log(currenIndex);
          //console.log(actualIndex);
          currentIndex = this.handleEnter(currentIndex);
          break;
        case keyCodes.RIGHT:
        case keyCodes.DOWN:
          currentIndex++;
          if (currentIndex >= this.tabData.length) {
              currentIndex = 0;
          }
          break;
        default:
          currentIndex = null;
      }
      return currentIndex;
    };

    Tabs.prototype.handleEnter = function(currentIndex) {
      // enter will either toggle an accordion or select a brand new item, depending on what mode we're in
      // so we have to deal with the currently focused element rather than the selected tab
      // since if we're in a screenreader, the focused element may not be the current element
      // screenreaders will want to manually select the tab
      // otherwise it follows as they move through the menu

      // also you have to do it this way because the focus area is either from the button in an li or an h3
      // so bypass the event originator altogether

      var currentTabByFocusIndex = document.getElementById(document.activeElement.getAttribute("aria-controls"));

      if (currentTabByFocusIndex !== this.currentTab.$tab_panel.get(0)) {
        currentIndex = this.$tab_panels.index(currentTabByFocusIndex);
      }
      return currentIndex;
    };

    /**
     * helper to identify if the clicked tab is what's currently open
     * @param $tab - jQuery element of the tab that's being evaluated
     */
    Tabs.prototype.isCurrentTab = function ($tabPanel) {
      return this.currentTab.$tab_panel.get(0) == $tabPanel.get(0);
    };

    /**
     * closes a tab if there's one open and a new one has been activated
     * Only one tab can be open at any given time
     * @param $tab - jquery element of the tab that's to be closed
     */
    Tabs.prototype.closeTab = function () {
      var currentTab = this.currentTab;

      currentTab.$title.attr({
        "tabindex": "-1",
        "aria-selected": "false"
      });

      currentTab.$tab_panel
        .removeClass(this.options.tab_class_panel_open)
        .attr({
          "aria-hidden": "true"
        });

      if (this.tabNav) {
        currentTab.$navItem.removeClass(this.options.tab_nav_class_open)
          .attr({
            "tabindex": "-1",
            "aria-selected": "false"
          });
      }

      this.currentTab = null;
    };

      /**
     * Opens the tab
     * @param $tab - jQuery element of the tab that's being opened
     */
    Tabs.prototype.openTab = function ($tab_panel) {
      var options = this.options;
      this.currentTab = {
        $tab_panel: $tab_panel
          .addClass(options.tab_class_panel_open)
          .attr({
            "aria-hidden": "false"
          }),
        $title: $tab_panel.prev(options.tab_class_title).attr({
          "aria-selected": true,
          "tabindex": "0"
        }),
        position: this.$tab_panels.index($tab_panel)
      };

      //console.log($tab_panel);
      if (this.tabNav) {
        this.updateTabNav();
      }
    };


    /**
     * Binds any events specific to Accordion functionality (tablet and mobile only)
     * Aria won't work here because:
      * there's no tablist role on any container
      * the tab panels are controlled by the nav and not the headers
     */
    Tabs.prototype.bindAccordionEvents = function () {
      var app = this;

      this.$container.on("click", this.options.tab_class_title, function (e) {
        e.preventDefault();
        app.toggleAccordion($(e.currentTarget).next(app.options.tab_class_panel));
      });

      this.$container.on("keydown", this.options.tab_class_title, function (e) {
        var currentIndex = app.keyHandler(e);

        if (currentIndex !== null) {
          app.toggleAccordion(app.$tab_panels.eq(currentIndex));
        }
      });
    };

    /**
     * Opens/Closes the accordion as needed
     * The accordion can be closed for all items at any given time, but if the window is resized, there has to be a tab that's open
     * This is why the functionality has been split up, so there's a special "accordion.closed_class" that closes the accordion, but doesn't
     * actually close the active tab, so that if you re-size the window back to desktop, you still see an active tab
     */
    Tabs.prototype.toggleAccordion = function ($tab_panel) {
      var $tabPanel = $tab_panel;

      // if it's the current tab, we want to just toggle it opened or closed for the viewer
      // we never actually disable the current tab without opening a new one, otherwise on desktop you can have the scenario where there's no open tab
      if (this.isCurrentTab($tabPanel)) {
        // todo update aria state
        $tabPanel.toggleClass(this.options.accordion.closed_class);
        this.updateAccordionAria();
        return false;
      }
      this.openAccordion($tabPanel);
    };

    /**
     * Helper to just close the accordion, adding the special "accordion.closed_class" class but not actually inactivating the current tab
     */
    Tabs.prototype.updateAccordionAria = function () {
      var currentTab = this.currentTab;
      if (currentTab.$tab_panel.hasClass(this.options.accordion.closed_class)) {
        currentTab.$tab_panel.attr("aria-hidden", "true").attr("aria-expanded", "false");
        currentTab.$title.attr("aria-expanded", "false");
      }
      else {
        currentTab.$tab_panel.attr("aria-hidden", "false").attr("aria-expanded", "true");
        currentTab.$title.attr("aria-expanded", "true");
      }
    };

  /**
   * Helper to open an accordion. Only 1 accordion can be open at a time, so this function actually just maps back onto the openTab() function, while removing the special "accordion.closed_class" class
   * @param $tabPanel - jQuery element of the tab being opened (tab = accordion in this case, it just looks like an accordion in mobile/tablet)
   */
    Tabs.prototype.openAccordion = function ($tabPanel) {
      this.$tab_panels.filter("." + this.options.accordion.closed_class).removeClass(this.options.accordion.closed_class);
      this.currentTab.$title.attr("aria-expanded", "false");
      this.closeTab();
      this.openTab($tabPanel);
      $("html, body").animate({
        scrollTop: $tabPanel.offset().top - 25
      }, 200);
      this.currentTab.$title.attr("aria-expanded", "true").focus();
    };

    /**
     * Starter function - calls necessary set up and opend the first relevent tab
     */
    Tabs.prototype.init = function () {
      var $startingTab;
      // save all the elements that will become tabs
      this.$tab_panels = this.$container.find(this.options.tab_class_panel);

      this.fetchTabData();

      // if there's more than 1 tab, then a tab navigation is created
      if (this.$tab_panels.length > 1) {
        this.createTabNav();
        this.bindNavEvents();
      }

      this.bindAccordionEvents();

      $startingTab = this.$tab_panels.eq(this.options.default_tab);
      if (this.$tab_panels.filter(".tabs-container__default").length) {
        $startingTab = this.$tab_panels.filter(".tabs-container__default");
      }
      this.openTab($startingTab);
    };

    return Tabs;

  })();

  $(function () {
    window.Tabs = Tabs;
    new window.Tabs($("#TabContainer"));
    $("#TabContainer").find(".accordion-wrapper").attr("role","tablist");
  });
}).call(this);
