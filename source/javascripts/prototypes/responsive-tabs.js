/* global Handlebars */
(function () {
  var Tabs;

  Tabs = (function () {

    var templates = {
      tplTabNav: Handlebars.compile("<ul class='inline-list tabs-navigation show-desktop' role='tablist'>{{#each tab}}<li role='presentation' class='tab-menu-item'><a href='#{{tabId}}' id='TabController-{{tabId}}' class='txt-btn tabs-navigation__button' role='tab' aria-selected='false' aria-controls='{{tabId}}' tabindex=-1 aria-expanded='false'>{{tabTitle}}</a></li>{{/each}}</ul>")
    };

    /**
     * Sets up the Tabs
     *
     * @param $container - parent of the items that will be tabbed together
     * @param $options - any overrides to the classes set below
     */
    function Tabs($container, options) {

      var defaults = {
        default_tab: "0",                          // index of tab to open on page load
        tab_class_panel: ".tabs-container__panel", // wrapper for each tab/accordion title and content
        tab_class_title: ".tabs-container__title", // title element for each tab/accordion
        tab_nav_id: "TabNav",                      // ID to provide the constructed tab navigation
        accordion: {
          closed_class: "accordion--closed"       // since the accordion can be closed for all tabs on mobile, extra class for just closing the accordion, even if the tab is technically active
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
      // array will be used to construct the navigation
      this.tabData = [];
      var i = 0,
        $tab_panels = this.$tab_panels,
        len = $tab_panels.length,
        $currentPanel,
        $panelTitle,
        currentPanelData;

      // for each of the tabs, fetch its title and ID from the HTML
      // save to a data object for that tab
      for (i; i < len; i++) {
        $currentPanel = $($tab_panels[i]);
        $panelTitle = $currentPanel.prev(this.options.tab_class_title);
        currentPanelData = {
          tabId: $tab_panels[i].id,
          tabTitle: $panelTitle.text()
        };

        this.tabData.push(currentPanelData);

        // update ARIA attrs for the panel and accordion title
        $currentPanel.attr({
          "role": "tabpanel",
          "aria-hidden": "true"
        });

        $panelTitle
          .attr({
            "tabindex": "-1",
            "role": "tab",
            "aria-controls": currentPanelData.tabId,
            "aria-selected": "false",
            "aria-expanded": "false"
          });
      }
    };

    /**
     * Builds the HTML for the tabbed navigation
     * for use in desktop only if there's more than 1 element to be tabbed
     */
    Tabs.prototype.createTabNav = function () {
      this.tabNav = true;
      this.$tabNav = $(templates.tplTabNav({
        "tab": this.tabData
      })).prependTo(this.$container);

      this.$tabNavItems = this.$tabNav.find("a");

      // add class to indicate that there's a navigation
      this.$container.addClass("tabs-nav-init");
    };

    /**
     * Binds the navigation events
     */
    Tabs.prototype.bindNavEvents = function () {
      var app = this;

      this.$tabNav.on("click", "a", function (e) {
        e.preventDefault();
        var $target = $(e.currentTarget),
          $tabPanel = $(this.getAttribute('href'));
        if (!app.isCurrentTab($tabPanel)) {
          app.closeTab();
          app.openTab($tabPanel);
          app.currentTab.$navItem.focus(); // focus only here so doesn't steal focus on page load
        }
      });

      // bind key navigation
      this.$tabNav.on("keydown", "a", function (e) {
        var currentIndex = app.handleKeyPress(e);
        if (currentIndex !== null) {
          app.closeTab();
          var panelId = app.tabData[currentIndex].tabId;
          app.openTab($(document.getElementById(panelId)));
          app.currentTab.$navItem.focus(); // focus only here so doesn't steal focus on page load
        }
      });
    };

    /**
     * helper to identify if the clicked tab is what's currently open
     * @param $tab_panel - jQuery element of the tab that's being evaluated
     */
    Tabs.prototype.isCurrentTab = function ($tab_panel) {
      return this.currentTab.$tab_panel.get(0) == $tab_panel.get(0);
    };

    /**
     * Key handler for tabs - allows arrow navigation
     */
    Tabs.prototype.handleKeyPress = function (e) {
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

      // disabling key down and keys temporarily
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
      var currentTabByFocusIndex = document.getElementById(document.activeElement.getAttribute("aria-controls"));

      if (currentTabByFocusIndex !== this.currentTab.$tab_panel.get(0)) {
        currentIndex = this.$tab_panels.index(currentTabByFocusIndex);
      }
      return currentIndex;
    };

    /**
     * Opens the tab
     * @param $tab_panel - jQuery element of the tab that's being opened
     */
    Tabs.prototype.openTab = function ($tab_panel) {
      var options = this.options;
      this.currentTab = {
        $tab_panel: $tab_panel
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
     * closes a tab if there's one open and a new one has been activated
     * Only one tab can be open at any given time
     */
    Tabs.prototype.closeTab = function () {
      var currentTab = this.currentTab;

      currentTab.$tab_panel
        .attr({
          "aria-hidden": "true"
        });

      // update accordion title values as well so everything is in synch
      currentTab.$title.attr({
        "tabindex": "-1",
        "aria-selected": "false",
        "aria-expanded" : "false"
      });

      if (this.tabNav) {
        currentTab.$navItem
          .attr({
            "tabindex": "-1",
            "aria-selected": "false",
            "aria-expanded" : "false"
          });
      }

      this.currentTab = null;
    };

    /**
     * Updates the dynamically created tab nav in desktop once a new tab has been opened
     * @param $tab - jQuery element for the tab that was just opened
     */
    Tabs.prototype.updateTabNav = function () {
      var currentTab = this.currentTab;

      currentTab.$navItem = this.$tabNavItems.eq(currentTab.position);
      currentTab.$navItem.attr({
        "tabindex": "0",
        "aria-selected": "true",
        "aria-expanded": "true"
      });
    };

    /**
     * Binds any events specific to Accordion functionality (tablet and mobile only)
     * ARIA initially didn't work here because:
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
        var currentIndex = app.handleKeyPress(e);

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
        currentTab.$tab_panel.attr("aria-hidden", "true");
        currentTab.$title.attr("aria-expanded", "false");
      }
      else {
        currentTab.$tab_panel.attr("aria-hidden", "false");
        currentTab.$title.attr("aria-expanded", "true");
      }
    };

  /**
   * Helper to open an accordion. Only 1 accordion can be open at a time, so this function actually just maps back onto the openTab() function, while removing the special "accordion.closed_class" class
   * @param $tab_panel - jQuery element of the tab being opened (tab = accordion in this case, it just looks like an accordion in mobile/tablet)
   */
    Tabs.prototype.openAccordion = function ($tab_panel) {
      this.$tab_panels.filter("." + this.options.accordion.closed_class).removeClass(this.options.accordion.closed_class);
      this.currentTab.$title.attr({
        "aria-expanded": "false",
        "aria-selected": "false"
      });
      this.closeTab();
      this.openTab($tab_panel);
      $("html, body").animate({
        scrollTop: $tab_panel.offset().top - 25
      }, 200);
      this.currentTab.$title.attr({
        "aria-expanded" : "true",
        "aria-selected" : "true"
      }).focus();
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