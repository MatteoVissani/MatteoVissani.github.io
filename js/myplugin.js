
$(document).ready(function () { // wait until the document is ready
    /* =====================
    Loading Animation
    ===================== */
    $(window).load(function () {
        $("body").css("overflow", "auto");
        $(".lodaing-overlay").fadeOut(1000);
    })
    /* =====================
   End Loading Animation
   ===================== */

    /* =====================
   Navbar Animation
   ===================== */
    // Smooth Scroll Navbar Links
    $(".menu .menu-items a, #home a").click(function (e) {
        if (this.getAttribute("href").charAt(0) == "#") {
            e.preventDefault();
            $(this).parent().addClass("active").siblings().removeClass("active");
            $("html, body").stop().animate({
                scrollTop: $($(this).attr("href")).offset().top
            }, 1400)
        } else {
            $($(this)).attr("target", "_blank")
        }
    })
    // Open Navbar
    $('.menu-trigger').click(function (next) {
        $(".nested-menu").toggleClass('open');
        $('.nested-menu .menu-items').removeClass('menu-visible');
        $('.nested-menu .menu-items').delay(100).queue(function () {
            $(this).addClass('menu-visible').dequeue();
        });
    });
    // Animation When menuigation When Window is Scrolled 
    $(window).scroll(function () {
        if ($(this).scrollTop() > 10) {
            $(".menu").addClass("scroll");
        }
        else {
            $(".menu").removeClass("scroll");
        }
    });
    /* =====================
   End Navbar Animation
   ===================== */
    /* =====================
   Filter Portfolio
   ===================== */
    var shuffleme = (function ($) {
        'use strict';
        var $grid = $('#grid'), //locate what we want to sort 
            $filterOptions = $('.portfolio-sorting li'),  //locate the filter categories
            $sizer = $grid.find('.shuffle_sizer'),    //sizer stores the size of the items

        init = function () {

            // None of these need to be executed synchronously
            setTimeout(function () {
                listen();
                setupFilters();
            }, 100);

            // instantiate the plugin
            $grid.shuffle({
                itemSelector: '[class*="col-"]',
                sizer: $sizer
            });
        },
        // Set up button clicks
        setupFilters = function () {
            var $btns = $filterOptions.children();
            $btns.on('click', function (e) {
                e.preventDefault();
                var $this = $(this),
                    isActive = $this.hasClass('active'),
                    group = isActive ? 'all' : $this.data('group');

                // Hide current label, show current label in title
                if (!isActive) {
                    $('.portfolio-sorting li a').removeClass('active');
                }

                $this.toggleClass('active');

                // Filter elements
                $grid.shuffle('shuffle', group);
            });

            $btns = null;
        },

        // Re layout shuffle when images load. This is only needed
        // below 768 pixels because the .picture-item height is auto and therefore
        // the height of the picture-item is dependent on the image
        // I recommend using imagesloaded to determine when an image is loaded
        // but that doesn't support IE7
        listen = function () {
            var debouncedLayout = $.throttle(300, function () {
                $grid.shuffle('update');
            });

            // Get all images inside shuffle
            $grid.find('img').each(function () {
                var proxyImage;

                // Image already loaded
                if (this.complete && this.naturalWidth !== undefined) {
                    return;
                }

                // If none of the checks above matched, simulate loading on detached element.
                proxyImage = new Image();
                $(proxyImage).on('load', function () {
                    $(this).off('load');
                    debouncedLayout();
                });

                proxyImage.src = this.src;
            });

            // Because this method doesn't seem to be perfect.
            setTimeout(function () {
                debouncedLayout();
            }, 500);
        };

        return {
            init: init
        };
    }(jQuery));
    shuffleme.init(); //filter portfolio
    /* =====================
    End Filter Portfolio
    ===================== */
    /* =====================
    Happy (statistics)
    ===================== */
    /* Note copyrights: All Copyrights return to  Roko C.Buljan (Stackoverflow)
    http://stackoverflow.com/questions/36455490/animate-counter-when-in-viewport
    */
    $(function ($, win) {
        $.fn.inViewport = function (cb) {
            return this.each(function (i, el) {
                function visPx() {
                    var H = $(this).height(),
                        r = el.getBoundingClientRect(), t = r.top, b = r.bottom;
                    return cb.call(el, Math.max(0, t > 0 ? H - t : (b < H ? b : H)));
                } visPx();
                $(win).on("resize scroll", visPx);
            });
        };
    }(jQuery, window));
    $(".counter").inViewport(function (px) { // Make use of the `px` argument!!!
        // if element entered V.port ( px>0 ) and
        // if prop initNumAnim flag is not yet set
        //  = Animate numbers
        if (px > 0 && !this.initNumAnim) {
            this.initNumAnim = true; // Set flag to true to prevent re-running the same animation
            $(this).prop('Counter', 0).animate({
                Counter: $(this).text()
            }, {
                duration: 4000,
                step: function (now) {
                    $(this).text(Math.ceil(now));
                }
            });
        }
    });
    /* =====================
    End Happy (statistics)
    ===================== */
    /* =====================
    Testimonials Animation
    ===================== */
    ; (function ($) {
        "use strict";
        /*Wrap Charaters in Span to do Animations*/
        $(".carousel .item h3").html(function (index, html) {
            return html.replace(/\S/g, '<span>$&</span>');
        });
        /*Add Animation Delay for Spans*/
        var animationDelay = .5;
        for (var i = 1; i < 20; i++) {
            // don't Worry about Vendor Prefixes As of jQuery 1.8, the .css() setter will automatically take care of prefixing the property name
            $(".carousel-inner .item span:nth-child(" + i + "n)").css("animation-delay", animationDelay + "s");
            animationDelay += .1;
        }
        // animate item contents
        var animationsItems = $(".carousel .item span");
        function animationContents() {
            $(animationsItems).addClass("rotateInUpLeft animated").delay(200000).queue(function (next) {
                $(this).removeClass("rotateInUpLeft animated");
                next();
            });
        }
        animationContents(); // Call animate css when page load This Call is responsible to run first slide animations
        // cache $(".carousel") in variable Because of that I will use this Selector more than once
        var $pencil_carousel = $(".carousel");
        $pencil_carousel.carousel(); //Initialize carousel (you Can See documentation of Bootstrap Carousel)
        //Other slides to be animated on carousel slide event
        $pencil_carousel.on("slide.bs.carousel", function (e) { // This event fires immediately when the slide instance method is invoked.
            animationContents(); // Call animationContents()
        });

        /*-----------------------------------------------------------------*/
        /* control slide animation duration
        /*-----------------------------------------------------------------*/
        var itemDurVal = $($pencil_carousel).data("duration"); /*get data-duration value of my carousel */
        $.fn.carousel.Constructor.TRANSITION_DURATION = itemDurVal;
        $(".carousel-inner .item").css({
            "transition-duration": itemDurVal + "ms" // don't Worry about Vendor Prefixes As of jQuery 1.8, the .css() setter will automatically take care of prefixing the property name
        });
        /*-----------------------------------------------------------------*/
        /* touchable Device SWIPE
        /*-----------------------------------------------------------------*/
        /*Note Copyrights:
         * I've got this code from an article Adding swipe support to Bootstrap Carousel 3.0 by Mr Justin Lazanowski.
         * you Can Review via This Link: http://lazcreative.com/blog/adding-swipe-support-to-bootstrap-carousel-3-0/
         */
        $(".carousel-inner").swipe({
            //Generic swipe handler for all directions
            swipeRight: function (event, direction, distance, duration, fingerCount) {
                $(this).parents('.carousel').carousel('prev');
            },
            swipeLeft: function () {
                $(this).parents('.carousel').carousel('next');
            },
            threshold: 0
        });
    })(jQuery);
    /* =====================
    End Testimonials Animation
    ===================== */

});