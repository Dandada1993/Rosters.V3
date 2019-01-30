<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv='expires' content='0'>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Chefette Login</title>
    <link rel="stylesheet" href="css/common.css" type="text/css" />
    <style>
        div.centre table
        { 
            margin-left: auto;
            margin-right: auto;
            text-align: center;
        }
    </style>
</head>
<body>
    <div id="container">
        <div id="header"></div>
        <div id="logo"><img src="/images/CRL-Logo-Head-Only.png" /></div>
        <div id="body">
        <div id="filler"></div>
        <div id="content">
        <div class="centre">
        <form name="Login" action="<?php echo htmlentities($_SERVER['PHP_SELF']); ?>" method="post">
            <table>
                <tr>
                    <td colspan="4"><span id="errormsg"></span></td>
                </tr>
                <tr>
                    <td rowspan="2"></td>
                    <td class="alignright"><span><label for="form_email">User Name</label></span></td>
                    <td class="alignleft"><input type="text" name="Username" value="" id="form_email" /></td>
                    <td rowspan="2"></td>
                </tr>
                <tr>
                    <td class="alignright"><span><label for="form_password">Password</label></span></td>
                    <td class="alignleft"><input name="password" value="" type="password" id="form_password" /></td>
                </tr>
                <tr>
                    <td class = "centre" colspan="4"><span><input type="submit" value="Login"/></span></td>
                </tr>
            </table>
        </form>
    </div>
    </div>
        </div>
        <div id="footer"></div>
    </div>
</body>
</html>