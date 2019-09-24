<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $rosterid = $parameters['id'];
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_allowedit');
    $database->addParameter('id', $rosterid, PDO::PARAM_STR);
    $results = $database->execute_noresult(); //returns and array each element being a returned dataset
    $database->release();
    //echo json_encode($results[0]);