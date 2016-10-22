<?php
interface IQuery
{
  public function limit($limit);
  public function offset($offset);
  public function where($where);
  public function all();
  public function count();

}
