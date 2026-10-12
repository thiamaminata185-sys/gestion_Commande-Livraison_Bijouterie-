<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'prenom'             => fake()->firstName(),
            'nom'                => fake()->lastName(),
            'email'              => fake()->unique()->safeEmail(),
            'telephone'          => fake()->phoneNumber(),
            'adresse'            => fake()->address(),
            'image'              => null,
            'actif'              => true,
            'motDePasse'         => static::$password ??= Hash::make('password'),
            'role'               => 'client',
            'email_verified_at'  => now(),
            'remember_token'     => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}