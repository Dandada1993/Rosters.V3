<?php

/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of database
 *
 * @author Ralph
 */
class database {
    
    public $conn = '';
    private $sql;
    private $stmt;
    public $parameters = array();
    public $results = array();
    
    function __construct($serverName, $database, $userid, $password) {
        try {
            $this->conn = new PDO( "sqlsrv:server=$serverName;Database=$database", $userid, $password, array (PDO::ATTR_TIMEOUT=>300));
            $this->conn->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
            //$this->conn->setAttribute( PDO::ATTR_TIMEOUT, 300);
        }  
        catch( PDOException $e ) {
           die( $e->getMessage() ); 
        }
    }
    
    function execProcedure($name){
        $this->sql = "exec $name";
        //print ("\$this->sql=".$this->sql);
    }
    
    function addParameter($name, $value, $type){
        if (count($this->parameters)==0){
            $this->sql .= " @$name=:$name";
        }else{
            $this->sql .= ",@$name=:$name";
        }
        $this->parameters[$name] = array($value, $type);
    }
    
    /*
     * This method executes a stored procedure and returns one or more result sets
     */
    function execute(){
        $this->stmt = $this->conn->prepare($this->sql);
        if (count($this->parameters) > 0){
            foreach ($this->parameters as $name=>$values){
                $this->stmt->bindParam(":$name", $values[0], $values[1]);
            }
        }
        $this->stmt->execute();
        //return $this->stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $i = 0;
        do {
            $this->results[$i] = $this->stmt->fetchAll(PDO::FETCH_ASSOC);
            $i++;
        } while ($this->stmt->nextRowset());
        return $this->results;
    }
    
    /*
     * This method executes a stored procedure and does not return a result set
     */
    function execute_noresult(){
        $this->stmt = $this->conn->prepare($this->sql);
        if (count($this->parameters) > 0){
            foreach ($this->parameters as $name=>$values){
                $this->stmt->bindParam(":$name", $values[0], $values[1]);
            }
        }
        $this->stmt->execute();
    }
    
    
    function getSQL(){
        return $this->sql;
    }
    
    function release(){
        $this->stmt = null;
        $this->conn = null;
    }
}

?>
