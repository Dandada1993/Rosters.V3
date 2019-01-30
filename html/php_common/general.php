<?php
    ini_set('display_errors',1); 
    error_reporting(E_ALL);
/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of general
 *
 * @author Ralph
 */
class general {
    //put your code here
    static function converttoTable(array $header, array $data){
        echo '<table id="report" class="pretty"><thead><tr>';
        foreach ($header as $title => $sortable)
        {
            if ($sortable == 0){
                echo "<th>$title</th>\r\n";
            }else if ($sortable == 1){
                echo "<th class=\"sorting\">$title</th>\r\n";
            }
        }
        echo "</tr></thead><tbody>";
        foreach ($data as $row)
        {
            echo "<tr>";
            foreach ($row as $element)
            {
                if ($element == '.0'){
                    $element = 0;
                }
                if (is_numeric($element)){
                    echo '<td align="right">';
                }
                else {
                    echo '<td>';
                }
                echo "$element</td>";
            }
            echo "</tr>";
        }
        echo "</tbody></table>";
    }
    
    /*
     * $data - the data to be displayed in the table
     * $headers - the title for each of the columns as an array e.g. array(0 => 'Name', 1 => 'DOB', 2 => 'Salary')
     * $sortcolumns - array listing columns to be sorted e.g array(0 => 1, 1 => 1)
     * $totalcolumns - array listing columns to be totals e.g. array(colname => 1)
     */
    static function converttoTable2(array $data, array $headers = null, array $sortcolumns = null, array $totalcolumns = null, $id = 'report', $class = 'pretty')
    {
        echo "<table id=\"$id\" class=\"$class\">";
        if (!is_null($headers))
        {
            echo "<thead><tr>";
            foreach ($headers as $i => $title)
            {
                $line = "<th>$title</th>\r\n";
                if (!is_null($sortcolumns))
                {
                    if (array_key_exists($i, $sortcolumns))
                    {
                        if ($sortcolumns[$i] === 1)
                        {
                            $line = "<th class=\"sorting\">{$headers[$i]}</th>\r\n";
                        }
                    }
                }
                echo $line;
            }
            echo "</tr></thead>";
        }
        else 
        {
            echo "<thead><tr>";
            $row = $data[0];
            foreach ($row as $colname => $value)
            {
                echo "<th>$colname</th>\r\n";
            }
            echo "</tr></thead>";
        }
        echo "<tbody>";
        $totals = array();
        $numcols = null;
        foreach ($data as $row)
        {
            echo "<tr>";
            //var_dump($row);
            $col = 0;
            foreach ($row as $colname => $value)
            {
                 if (is_null($numcols))
                {
                    $numcols = count($row);
                    for ($i = 0; $i < $numcols; $i++){
                        $totals[$i] = '-';
                    }
                }
                if ($value == '.0'){
                    $value = 0;
                }
                if (is_numeric($value))
                {
                    echo '<td align="right">';
                }
                else {
                    echo "<td>";
                }
                echo "$value</td>";
                //determine if this column is to be totalled
                if (!is_null($totalcolumns))
                {
                    if (array_key_exists($colname, $totalcolumns))
                    {
                        if (array_key_exists($col, $totals))
                        {
                            $totals[$col] = $totals[$col] + (float) $value;
                        }else{
                            $totals[$col] = (float) $value;
                        }
                    }
                }
                $col++;
            }
            echo "</tr>";
        }
        //echo "<br>totals</br>";
        //var_dump($totals);
        if (!is_null($totalcolumns))
        {
            //print totals
            echo "<tfoot><tr>";
            for ($i = 0; $i < $numcols; $i++)
            {
                if ($totals[$i] !== '-')
                {
                    $val = number_format($totals[$i], 2);
                    echo "<td align=\"right\">$val</td>";
                }
                else
                {
                    echo "<td> </td>"; //using &nbsp; here cause a problem with the export to excel function - Invalid XML
                }
            }
            echo "</tr></tfoot>";
        }
        echo "</tbody>";
        echo "</table>";
    }
    
    static function isEven($number)
    {
        if ($number % 2 == 0) {
          return TRUE;
        }
        else{
            return FALSE;
        }
    }
    
    static function findmatchingrows($resultset, $column, $value){
        $results = array();
        
        if (is_array($resultset)){
            foreach($resultset as $row){
                if (key_exists($column, $row) && $row[$column] == $value){
                    $results[] = $row;
                }
            }
        }
        
        return $results;
    }
    
    static function findmatchingrows2($resultset, $keyvalues){
        $results = array();
        
        if (is_array($resultset)){
            foreach($resultset as $row){
                $addrow = true;
                foreach($keyvalues as $key => $value)
                {
                    if (key_exists($key, $row)){
                        if ($row[$key] != $value){
                            $addrow = false;
                        }
                    }else{
                        $addrow = false;
                    }
                }
                if ($addrow){
                    $results[] = $row;
                }
            }
        }
        
        return $results;
    }
    
}

?>
