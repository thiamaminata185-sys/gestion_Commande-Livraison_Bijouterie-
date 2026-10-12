<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    protected $table = 'categories';
    protected $primaryKey = 'idCategorie';

    protected $fillable = ['nomCategorie', 'descriptionCategorie'];

    public function bijoux()
    {
        return $this->hasMany(Bijou::class, 'idCategorie');
    }
}