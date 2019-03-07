<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $locID = $parameters['locID'];
    $weekstarting = $parameters['weekstarting'];
    //$lastedited = date('Y-m-d h:i A');
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_saveroster');
    $database->addParameter('locID', $locID, PDO::PARAM_STR);
    $database->addParameter('weekstarting', $weekstarting, PDO::PARAM_STR);
    //$database->addParameter('lastedited', $lastedited, PDO::PARAM_STR);
    $results = $database->execute(); //returns and array each element being a returned dataset
    $database->release();
    echo json_encode($results[0]);