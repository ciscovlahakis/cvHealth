# frozen_string_literal: true

class MealPlanGenerator
  def initialize(user)
    @user = user
  end

  def generate
    # Your meal plan generation code goes here

    # This is just a placeholder. Your actual generation code would likely be much more complex.
    {
      'Monday' => {
        'Breakfast' => {
          'Min Foods' => 1,
          'Max Foods' => 3,
          'Categories' => %w[Breakfast American],
          'Meal' => {
            'Min Foods' => 1,
            'Max Foods' => 1,
            'Categories' => ['Ketogenic'],
            'Foods' => { 'Omelette' => ['30g Egg', '10g Peppers'] }
          },
          'Snack' => {
            'Min Foods' => 1,
            'Max Foods' => 1,
            'Categories' => ['Crunchy'],
            'Foods' => { 'Protein Bar' => ['100g Chicken'] }
          }
        },
        'Dinner' => {
          'Min Foods' => 3,
          'Max Foods' => 3,
          'Categories' => %w[Dinner Cantonese Spicy],
          'Allergies' => ['Fish'],
          'Course I' => {
            'Min Foods' => 1,
            'Max Foods' => 1,
            'Dish I' => {
              'Min Foods' => 1,
              'Max Foods' => 1,
              'Categories' => ['Vegan'],
              'Foods' => { 'Lo Mein' => ['Vegan'] }
            },
            'Dish II' => {
              'Min Foods' => 1,
              'Max Foods' => 1,
              'Foods' => { 'Char Siu' => [] }
            }
          }
        }
      },
      'Tuesday' => {
        'Breakfast' => {
          'Min Foods' => 1,
          'Max Foods' => 3,
          'Categories' => %w[Breakfast Continental],
          'Meal' => {
            'Min Foods' => 1,
            'Max Foods' => 1,
            'Categories' => ['Vegetarian'],
            'Foods' => { 'Pancakes' => ['100g Flour', '50g Sugar', '200ml Milk'] }
          },
          'Snack' => {
            'Min Foods' => 1,
            'Max Foods' => 1,
            'Categories' => ['Sweet'],
            'Foods' => { 'Muffin' => ['100g Blueberries'] }
          }
        },
        'Dinner' => {
          'Min Foods' => 3,
          'Max Foods' => 3,
          'Categories' => %w[Dinner Italian],
          'Allergies' => ['Gluten'],
          'Course I' => {
            'Min Foods' => 1,
            'Max Foods' => 1,
            'Dish I' => {
              'Min Foods' => 1,
              'Max Foods' => 1,
              'Categories' => ['Vegetarian'],
              'Foods' => { 'Pasta' => ['Vegan'] }
            },
            'Dish II' => {
              'Min Foods' => 1,
              'Max Foods' => 1,
              'Foods' => { 'Tiramisu' => [] }
            }
          }
        }
      }
    }
  end
end
