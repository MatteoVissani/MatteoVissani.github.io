	jQuery(document).ready(function ($) { // Run Code When Document is Ready
    // Show That Message Is Sent Successfully
    $('.success').height($('#contact-me .contact-me-nested').height());
    //Wrap Charaters in Span to do Animations
    $(".success h4").html(function (index, html) {
        return html.replace(/\S/g, '<span>$&</span>');
    });
    /*Add Animation Delay for Spans*/
    var animationDelay = .1;
    for (var i = 1; i < 40; i++) {
        // don't Worry about Vendor Prefixes As of jQuery 1.8, the .css() setter will automatically take care of prefixing the property name
        $(".success h4 span:nth-child(" + i + "n)").css("animation-delay", animationDelay + "s");
        animationDelay += .1;
    }

    $('#ajax-form').on('submit', function () {
        $('[class^="error"]').slideUp('slow');

		var error = false;
		var name = $.trim($('input[type="text"]').val());
		var email = $.trim($('input[type="email"]').val());
		var email_regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
		if(name == "") {
		    $('.error-name').slideDown('slow');
			error = true; 
		}
		if (email == "") {
		    $('.error-emailEmpty').slideDown('slow');
			error = true;
		}
		else if (!email_regex.test(email)) {
		    $('.error-notValid').fadeIn('slow');
			error = true;
		}
		if(error == true) {
			return false;
		}
		var form_data = $('#ajax-form').serialize(); // Get data from ajax-form

		$.ajax({
			type: "POST",
			url: $('#ajax-form').attr('action'),
			data: form_data,
			timeout: 6000,
			success: function() {
			    $('#ajax-form').slideUp('slow');
			    $('.success').slideDown('slow');
			    $('.success h4 span').delay(2000).addClass("rotateIn animated").delay(2000).queue(function (next) {
			        $(this).removeClass("rotateIn animated");
			        next();
			    });
			}
		});
		return false; // Prevent the browser from opening mail-it.php file
    }); // end click function
}); // End Document Ready Function
