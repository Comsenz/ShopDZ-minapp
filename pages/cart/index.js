const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
const addCartUrl = curl + '/api.php/basket/addBasket'; // 加入购物车
Page({

  /**
   * 页面的初始数据
   */
  data: {
    total:false, //是否全选
    deltotal:false,//全选删除
    totalPrice:0, //总价
    list:[],
    isEdit:false,
    selection:[],
    selection: [],
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
  },
  //获取用户购物车数据
  shopping_cart:function(){
    // console.log(11);
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl +'api.php/basket/getBasket',
      data: {key:key},
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method: 'POST',
      success: function(res) {
        if(res.data.code == 0){
          var data = res.data.data;
          data.forEach(function(dataOne) {
            console.log(dataOne);
            if (dataOne.goods_name.length > 10) {
              dataOne.goods_name = dataOne.goods_name.substring(0, 10)+'...';
            }
            console.log(dataOne.goods_name.length);
            if (dataOne.status == 2){
              wx.showToast({
                title: dataOne.goods_name+"商品中有下架商品请删除下架商品,以免给您带来困扰",
                icon: 'none',
                duration: 2500
              })
            } else if (dataOne.status == 3){
              wx.showToast({
                title: dataOne.goods_name+"的商品数量已售罄请删除售罄商品,以免给您带来困扰",
                icon: 'none',
                duration: 2500
              })
            }
            if(dataOne.status == 1){
              wx.showToast({
                title: dataOne.goods_name + "的商品数量超库存请删除超库存商品,以免给您带来困扰",
                icon: 'none',
                duration: 2500
              })
            }
          });
          self.setData({
            list: res.data.data,
          })
          // console.log(res.data.data);
        }
      },
      fail: function(res) {},
      complete: function(res) {},
    })
  },

  /* 输入框事件 */
  bindManual: function (e) {
    var num = e.detail.value;
    var goods_id = e.currentTarget.dataset.item;
    var regPos = /^\d+(\.\d+)?$/; //非负浮点数
    var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
    if (regPos.test(num) || regNeg.test(num)) {
      if (num > 100) {
        wx.showToast({
          title: '数值过大',
          icon: 'loading',
          duration: 2000
        })
        return;
      }
      var self = this;
      var list = self.data.list;
      var price = self.data.totalPrice;
      for (var i = 0; i < list.length; i++) {
        if (goods_id == list[i].goods_id) {
          list[i].goods_num = num;
          if (self.data.totalPrice !== 0) {
            price = price + list[i].goods_price * list[i].goods_num;
          }
          self.addCart(list[i].goods_num, goods_id);
        }
      }
      self.setData({
        list: list,
        totalPrice: price,
      });
    } else {
      wx.showToast({
        title: '数量必须为数字',
        icon: 'loading',
        duration: 2000
      })
      return;
    }
  },


  //单选
  single:function(e){
    var self = this;
    if (self.data.totalPrice !== 0){
      var price = Number(self.data.totalPrice);
    }else{
      var price = 0;
    }
    var goods_id = e.currentTarget.dataset.id;
    var selection = this.data.selection;
    var id = e.currentTarget.dataset.goods_id;
    var list = self.data.list;
    var key = [];
    var meet = new Array();
    for (var i = 0; i < list.length;i++){
      if(goods_id == list[i].goods_id){
        
      }
    }

    list.forEach(function(dataOne){
      if(goods_id == dataOne.goods_id){
        if (!dataOne.select || dataOne.select == 0) {
          dataOne.select = 1;
          price = price + dataOne.goods_price * dataOne.goods_num;
          meet.push(id);
          key = selection.concat(meet);
        } else {
          dataOne.select = 0;
          if (self.data.totalPrice == 0) {
            price = 0;
          } else {
            price = price - dataOne.goods_price * dataOne.goods_num;
          }
          selection.forEach(function (dataOnes) {
            if (id == dataOnes) {
              var index = selection.indexOf(dataOnes);
              selection.splice(index, 1);
            }
          });
          key = selection;
        }
      }
    });
    if(price >1){
      price = price.toFixed(2)
    }

    console.log(key);
    self.setData({
      list: list,
      totalPrice: price,
      selection: key,
      total:false,
    });
  },
  //全选
  allselection:function(){
    var self = this;
    let price = 0;
    var list = self.data.list;
    var meet = []; 
    var selection = [];
    var key = [];

    list.forEach(function(dataAll){
      if (self.data.total) {
        dataAll.select = 0;
        price = 0;
      }else{
        meet.push(dataAll.id);
        dataAll.select = 1;
        price = price + dataAll.goods_price * dataAll.goods_num;
      }
    });

    key = selection.concat(meet);
    price = price.toFixed(2)
    console.log(key);
    self.setData({
      list: list,
      totalPrice: price,
      selection:key,
      total:!this.data.total
    });
  },
  //全选删除
  delallselection: function() {
    var self = this;
    var list = self.data.list;
    var meet = [];
    var key = [];

    list.forEach(function(delall){
      if(self.data.deltotal){
        delall.selects = 0
      }else{
        meet.push(delall.id);
        delall.selects = 1;
      }
    });
    key = key.concat(meet);
    console.log(key);
    self.setData({
      list: list,
      selection: key,
      deltotal: !this.data.deltotal
    });
  },

  delsingle: function (e) {
    var self = this;
    var goods_id = e.currentTarget.dataset.id;
    var selection = this.data.selection;
    var id = e.currentTarget.dataset.goods_id;
    var list = self.data.list;
    var meet = new Array();
    var key = [];
    list.forEach(function(delOne){
      if (goods_id == delOne.goods_id){
        if (!delOne.selects || delOne.selects ==0){
          delOne.selects = 1;
          meet.push(id);
          key = selection.concat(meet);
        }else{
          delOne.selects = 0;
          selection.forEach(function (delOne) {
            if (id == delOne) {
              var index = selection.indexOf(delOne);
              selection.splice(index, 1);
            }
          });
          key = selection;
        }
      }
    });
    self.setData({
      list: list,
      selection: key,
      deltotal: false,
    });
  },
  editFun(){ //编辑
    if (this.data.isEdit){
      this.setData({
        isEdit: !this.data.isEdit,
        selection: [],
        totalPrice: 0,
      })
    }else{
      var list = this.data.list;
      list.forEach(function(dataOne){
        dataOne.select = 0;
      });
      this.setData({
        isEdit: !this.data.isEdit,
        total: false,
        selection: [],
        list:list,
        totalPrice: 0,
      })
    }
  },
  //跳转页面
  jump: function () {
    //购物车
    var url = '../index/index';
    wx.switchTab({
      url: url,
    });
  },
  //增加商品数量
  plusFun(e){
    var goods_id = e.currentTarget.dataset.item;
    var self = this;
    var list = self.data.list;
    var price = self.data.totalPrice;
    for (var i = 0; i < list.length; i++) {
      if (goods_id == list[i].goods_id){
        list[i].goods_num++;
        if (self.data.totalPrice !== 0){
          price = price + list[i].goods_price * list[i].goods_num;
        }
        if (list[i].goods_num > 100) {
          wx.showToast({
            title: '数值过大',
            icon: 'loading',
            duration: 2000
          })
          return;
        }
        self.addCart(list[i].goods_num, goods_id);
      }
    }
    self.setData({
      list: list,
      totalPrice: price,
    });
  },
  reduceFun(e) {
    var self = this;
    var goods_id = e.currentTarget.dataset.item;
    var list = self.data.list;
    var price = self.data.totalPrice;
    for (var i = 0; i < list.length; i++) {
      if (goods_id == list[i].goods_id) {
        if (list[i].goods_num > 1) {
          list[i].goods_num--;
        }else{
          return;
        }
        if (self.data.totalPrice !== 0) {
          price = price - list[i].goods_price * list[i].goods_num;
        }
        self.addCart(list[i].goods_num, goods_id);
      }
    }
    self.setData({
      list: list,
      totalPrice: price,
    });
  },
  addCart: function (num, goods_id) {
    var self = this;
    var gooid = goods_id;
    var num = num;
    if (!gooid) {
      return;
    }
    var key = wx.getStorageSync('key');
    var params_wx = {
      id: gooid,
      num: num,
      type: 'basket',
      key: key,
    };

    wx.request({
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      url: addCartUrl,
      data: params_wx,
      success: function (res) {
        console.log(res);
      },
      fail: function (res) {
        console.log(res);
      },
      complete: function () {
        console.log('complete');
      }
    })
  },
  hide_mask: function () {
    var that = this;
    setTimeout(function () {
      that.setData({
        hasUserInfo: true,
        usershow: false,
      })
    }, 200)
  },
  delItemFun(e){ //删除单商品
    var self = this;
    var member_uid = self.data.list[0].member_uid;
    var selection = self.data.selection;
    var key = wx.getStorageSync('key');
    var params_wx = {
      id: 0,
      member_uid: member_uid,
      key: key,
    };
    if (selection.length > 0){
      wx.showModal({
        title: '确定将已选中的' + selection.length + '件商品删除吗？',
        cancelText: "取消", //默认是“取消”
        confirmText: "确定", //默认是“确定”
        success(res) {
          if (res.cancel) {
            console.log('隐藏');
          } else {
            selection.forEach(function (listId) {
              params_wx.id = listId;
              wx.request({
                url: curl + 'api.php/basket/delBasket',
                data: params_wx,
                header: {
                  'content-type': 'application/x-www-form-urlencoded' // 默认值
                },
                method: 'POST',
                success: function (res) {
                  console.log(res);
                  self.shopping_cart();
                  wx.showToast({
                    title: '删除成功',
                    icon: 'success',
                    duration: 2000
                  });
                }
              })
            });
          }
        }
      });
    }else{
      wx.showToast({
        title: '请选择要删除的商品',
        icon: 'none',
        duration: 2500
      })
    }
  },
  closeFun(){
    var self = this;
    var selection = self.data.selection;
    var goods_id = selection.join(",");
    if (goods_id == ''){
      return;
    }else{
      var url = '../orderDetails/index?id='+goods_id;
      wx.navigateTo({
        url: url,
      });
      
    }

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;
    self.shopping_cart();
    console.log(wx.getStorageSync('key'));
    // 获取用户信息 是否授权
    wx.getSetting({
      success: res => {

        if (res.authSetting['scope.userInfo']) {
          this.setData({
            usershow: false,
          })
        } else {
          this.setData({
            usershow: true,
          })
        }
      }
    });
  },

  getUserInfo: function (e) {
    var that = this;
    if (e.detail.userInfo) {
      console.log(e.detail.userInfo);
      app.globalData.userInfo = e.detail.userInfo

    } else {
      //用户按了拒绝按钮
      wx.showModal({
        title: '警告',
        content: '您点击了拒绝授权，将无法进入小程序，请授权之后再进入!!!',
        showCancel: false,
        confirmText: '返回授权',
        success: function (res) {
          if (res.confirm) {
            that.setData({
              hasUserInfo: false,
              usershow: true,
            })
            console.log('用户点击了“返回授权”')
          }
        },
        complete: function () {
          that.setData({
            hasUserInfo: false,
            usershow: true,
          })
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var self = this;
    wx.getSetting({
      success: res => {

        if (res.authSetting['scope.userInfo']) {
          this.setData({
            usershow: false,
          })
        } else {
          this.setData({
            usershow: true,
          })
        }
      }
    });
    self.shopping_cart();
    self.setData({
      total:false,
      totalPrice:0,
      selection:[],
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var self = this;
    // var fid = e.target.dataset.fid;
    return {
      title: 'shopDz商城小程序',
      path: '/pages/index/index',
      imageUrl: '/images/logo.png',
      // imageUrl:'http://shopdz.pm.comsenz-service.com/data/Attach/Common/2016-12-15/58521b24ee461.png',
      success: function (res) {
        // 分享成功
        wx.showToast({
          title: '分享成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: function (res) {
        // 分享失败
      }
    }
  }
})