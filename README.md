rjListing
==========
Private.

A listing module to create a "list" or "grid" of results.

Includes features to predefine settings via attrs, sort, filter, paginate, show more etc. and cancels multiple requests.

Also has keyboard shortcuts for the pagination and more.

**Example markup:**

Note the `ie-sort` directive for sorting.

Otherwise, it simply puts the results into the list.data scope for you to iterate over with ng-repeat.

	<div ie-listing="/AdminCustomer/JSON" limit="20" sort="FirstName" dir="ASC" ng-cloak>

	    <table class="{{list.isLoading()}}" >

			<thead>
			    <tr class="sort">
				    <th><button ie-sort="FirstName">First Name</button> <button ie-sort="LastName">Last Name</button></th>
				    <th><button ie-sort="EMail">EMail</button></th>
				    <th><button ie-sort="Telephone">Telephone</button></th>
			    </tr>
		    </thead>

		    <tbody ng-repeat="prop in list.data track by prop.CID" class="">
			    <tr>
					<td><a href="/Admin/Customer/{{prop.CID}}" class="customerName editBtn" title="{{prop.FirstName}} {{prop.LastName}}" ><span class="profileImage"><img rj-gravatar="{{prop.EMail}}" size="30" default="mm" /></span> <span ng-bind="prop.FirstName"></span> <span ng-bind="prop.LastName"></span></a></td>
					<td><a href="mailto:{{prop.EMail}}" ng-bind="prop.EMail"></a></td>
					<td><a href="tel:{{prop.Telephone}}" ng-bind="prop.Telephone"></a></td>
				</tr>
		    </tbody>
	    </table>

    </div>

example filter using `ie-filter` (addtional atts are merged in so you can define more filter options like `text="ne"` - for a notEqualTo comparison):

	<label class="status_7"><input type="checkbox" ie-filter="Status" value="7" class="tickbox" checked="checked">NTU</label>

**Toolbars** (for pagination) and **errors** are added via the templates.