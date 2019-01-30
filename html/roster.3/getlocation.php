<?php
    //require('stdheaders.php');
    require('db.php');

    $database = new database($serverName, $dbname, $userid, $password);

    function getLocations()
    {
        global $database;
        $database->execProcedure('tareports.roster.get_location'); //locID, Name, weekending, agreedtohours, additionalhours
        $results = $database->execute(); //returns and array each element being a returned dataset
        $database->release();
        return $results[0];
    }