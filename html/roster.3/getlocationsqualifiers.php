<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $weekstarting = $parameters['weekstarting'];
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_getvalidpositions_all');
    $database->addParameter('weekstarting', $weekstarting, PDO::PARAM_STR);
    $results = $database->execute(); //returns and array each element being a returned dataset
    $database->release();
    echo json_encode($results[0]);