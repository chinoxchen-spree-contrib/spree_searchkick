module Spree::ProductDecorator
  def self.prepended(base)
    base.searchkick text_middle: [:name], settings: { number_of_replicas: 0 } unless base.respond_to?(:searchkick_index)

    def base.autocomplete_fields
      [:name]
    end

    def base.search_fields
      [:name]
    end

    def base.autocomplete(keywords)
      if keywords && keywords != '%QUERY'
        puts 'keywords'
        puts keywords
        Spree::Product.search(
          keywords,
          fields: autocomplete_fields,
          match: :text_middle,
          limit: 10,
          operator: 'or',
          load: false,
          misspellings: { below: 2, edit_distance: 3 },
          where: search_where,
        ).map(&:name).map(&:strip).uniq
      else
        Spree::Product.search(
          "*",
          fields: autocomplete_fields,
          load: false,
          misspellings: { below: 2, edit_distance: 3 },
          where: search_where,
        ).map(&:name).map(&:strip)
      end
    end

    def base.search_where
      {
        active: true,
        price: { not: nil },
      }
    end
  end

  def search_data
    json = {
      name: name,
      description: description,
      active: can_supply?,
      created_at: created_at,
      updated_at: updated_at,
      price: price,
      currency: currency,
      conversions: orders.complete.count,
      taxon_ids: taxon_and_ancestors.map(&:id),
      taxon_names: taxon_and_ancestors.map(&:name),
    }

    Spree::Property.all.each do |prop|
      json.merge!(Hash[prop.name.downcase, property(prop.name)])
    end

    Spree::Taxonomy.all.each do |taxonomy|
      json.merge!(Hash["#{taxonomy.name.downcase}_ids", taxon_by_taxonomy(taxonomy.id).map(&:id)])
    end

    json
  end

  def taxon_by_taxonomy(taxonomy_id)
    taxons.joins(:taxonomy).where(spree_taxonomies: { id: taxonomy_id })
  end
end

Spree::Product.prepend(Spree::ProductDecorator)
