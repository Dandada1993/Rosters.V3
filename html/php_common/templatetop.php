<script type="text/javascript" charset="utf-8">
    function displayCommonUserName(){
        var username = getValueFromNotesUserData("CommonUserName");
        if (username === 'Anonymous'){
            //alert('Anonymous');
            document.getElementById("user-options").style.display = none;
        }else{
            document.getElementById("username").innerHTML = "Welcome " + username;
        }
    }
    
    $(document).ready(function () {
	//$("#user-options-menu-container").hide();
	$menu = $("#user-options-menu").menu();
        $menu.removeClass("ui-corner-all").addClass("ui-corner-bottom");
	$menu.hide();
	$("#user-options").on("click", function(e) {
		$menu.show();
		e.stopPropagation();
	});
	$(document).on("click", function(e) {
		$menu.hide();
	});
        /*$("#userdata").load(function(){
            var username = getValueFromNotesUserData("CommonUserName");
            if (username === 'Anonymous'){
                //alert('Anonymous');
                $("#user-options").hide();
                $("#optionarrow").hide();
                //document.getElementById("user-options").style.display = none;
            }else{
                $("#username").innerHTML = "Welcome " + username;
                //document.getElementById("username").innerHTML = "Welcome " + username;
            }
        })*/
    });
</script>
<div id="container">
    <iframe src="/ChefetteIntranet.nsf/UserData?OpenForm" id="userdata"></iframe>
<div id="header"><div class="headerinfo"><div id="user-options"><span id="optionarrow" class="ui-icon ui-icon-triangle-1-s"></span></div><div id="username"></div>
	<div id="user-options-menu-container">
		<ul id="user-options-menu" >
			<li><a href="/names.nsf?ChangePassword">Change Password</a></li>
			<li><a href="/names.nsf?Logout">Logout</a></li>
		</ul>
	</div></div></div>
<div id="logo"><img src="/images/CRL-Logo-Head-Only.png" /></div>
<div id="body">
<div id="filler"></div>
<div id="content">
        